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

// ListViewsParams drives the List query.
type ListViewsParams struct {
	// NamePrefix filters views whose display_name starts with this string (case-insensitive).
	NamePrefix string
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// ViewRepository provides CRUD and specialised queries for the views table.
type ViewRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewViewRepository creates a ViewRepository backed by db.
func NewViewRepository(db *gorm.DB) *ViewRepository {
	return &ViewRepository{db: db, q: dao.Use(db)}
}

// List returns views matching params along with the total count.
func (r *ViewRepository) List(ctx context.Context, params ListViewsParams) ([]*model.View, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	v := r.q.View.WithContext(ctx)

	if params.NamePrefix != "" {
		v = v.Where(r.q.View.DisplayName.Lower().Like(strings.ToLower(params.NamePrefix) + "%"))
	}

	// Get total count before pagination
	total, err := v.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.View, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			v = v.Order(expr)
		}
	} else {
		v = v.Order(r.q.View.CreatedAt.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		v = v.Offset(offset)
	}
	v = v.Limit(params.PageSize)

	ms, err := v.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the view with the given ID.
// Returns gorm.ErrRecordNotFound when no such view exists.
func (r *ViewRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.View, error) {
	return r.q.View.WithContext(ctx).Where(r.q.View.ID.Eq(id)).First()
}

// Create inserts a new view.
func (r *ViewRepository) Create(ctx context.Context, m *model.View) error {
	return r.q.View.WithContext(ctx).Create(m)
}

// Update updates fields of an existing view matched by its primary key.
func (r *ViewRepository) Update(ctx context.Context, m *model.View) error {
	_, err := r.q.View.WithContext(ctx).Where(r.q.View.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the view with the given ID.
func (r *ViewRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.View.WithContext(ctx).Where(r.q.View.ID.Eq(id)).Delete()
	return err
}
