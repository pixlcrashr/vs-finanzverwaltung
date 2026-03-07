package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListBudgetRevisionsParams drives the List query.
type ListBudgetRevisionsParams struct {
	// BudgetID filters revisions for a specific budget.
	BudgetID uuid.UUID
	// OrderBy specifies the ordering expression (e.g., "date desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// BudgetRevisionRepository provides CRUD for budget_revisions table.
type BudgetRevisionRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewBudgetRevisionRepository creates a BudgetRevisionRepository backed by db.
func NewBudgetRevisionRepository(db *gorm.DB) *BudgetRevisionRepository {
	return &BudgetRevisionRepository{db: db, q: dao.Use(db)}
}

// List returns budget revisions matching params along with the total count.
func (r *BudgetRevisionRepository) List(ctx context.Context, params ListBudgetRevisionsParams) ([]*model.BudgetRevision, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	br := r.q.BudgetRevision.WithContext(ctx).Where(r.q.BudgetRevision.BudgetID.Eq(params.BudgetID))

	// Get total count before pagination
	total, err := br.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.BudgetRevision, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			br = br.Order(expr)
		}
	} else {
		br = br.Order(r.q.BudgetRevision.Date.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		br = br.Offset(offset)
	}
	br = br.Limit(params.PageSize)

	ms, err := br.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the budget revision with the given ID.
func (r *BudgetRevisionRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.BudgetRevision, error) {
	return r.q.BudgetRevision.WithContext(ctx).Where(r.q.BudgetRevision.ID.Eq(id)).First()
}

// Create inserts a new budget revision.
func (r *BudgetRevisionRepository) Create(ctx context.Context, m *model.BudgetRevision) error {
	return r.q.BudgetRevision.WithContext(ctx).Create(m)
}

// Update updates fields of an existing budget revision.
func (r *BudgetRevisionRepository) Update(ctx context.Context, m *model.BudgetRevision) error {
	_, err := r.q.BudgetRevision.WithContext(ctx).Where(r.q.BudgetRevision.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the budget revision with the given ID.
func (r *BudgetRevisionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.BudgetRevision.WithContext(ctx).Where(r.q.BudgetRevision.ID.Eq(id)).Delete()
	return err
}
