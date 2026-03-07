package repository

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListImportSourcesParams drives the List query.
type ListImportSourcesParams struct {
	// NamePrefix filters import sources whose display_name starts with this string (case-insensitive).
	NamePrefix string
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// ImportSourceRepository provides CRUD and specialised queries for the import_sources table.
type ImportSourceRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewImportSourceRepository creates an ImportSourceRepository backed by db.
func NewImportSourceRepository(db *gorm.DB) *ImportSourceRepository {
	return &ImportSourceRepository{db: db, q: dao.Use(db)}
}

// List returns import sources matching params along with the total count.
func (r *ImportSourceRepository) List(ctx context.Context, params ListImportSourcesParams) ([]*model.ImportSource, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	is := r.q.ImportSource.WithContext(ctx)

	if params.NamePrefix != "" {
		is = is.Where(r.q.ImportSource.DisplayName.Lower().Like(strings.ToLower(params.NamePrefix) + "%"))
	}

	// Get total count before pagination
	total, err := is.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.ImportSource, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			is = is.Order(expr)
		}
	} else {
		is = is.Order(r.q.ImportSource.CreatedAt.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		is = is.Offset(offset)
	}
	is = is.Limit(params.PageSize)

	ms, err := is.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the import source with the given ID.
// Returns gorm.ErrRecordNotFound when no such import source exists.
func (r *ImportSourceRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.ImportSource, error) {
	return r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(id)).First()
}

// Create inserts a new import source.
func (r *ImportSourceRepository) Create(ctx context.Context, m *model.ImportSource) error {
	return r.q.ImportSource.WithContext(ctx).Create(m)
}

// Update updates fields of an existing import source matched by its primary key.
func (r *ImportSourceRepository) Update(ctx context.Context, m *model.ImportSource) error {
	_, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the import source with the given ID.
func (r *ImportSourceRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(id)).Delete()
	return err
}
