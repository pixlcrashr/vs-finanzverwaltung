package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"gorm.io/gorm"
)

// ListImportSourcesParams drives the List query.
type ListImportSourcesParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// importSourceColumnMapper maps filter field names to database column names.
func importSourceColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
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

	db := r.db.WithContext(ctx).Table("import_sources")

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, importSourceColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = db.Order("created_at DESC")
	} else {
		if exprs := ResolveOrderBy(&r.q.ImportSource, params.OrderBy); len(exprs) > 0 {
			for _, expr := range exprs {
				db = db.Order(expr)
			}
		} else {
			db = db.Order("created_at DESC")
		}
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.ImportSource
	if err := db.Find(&ms).Error; err != nil {
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
