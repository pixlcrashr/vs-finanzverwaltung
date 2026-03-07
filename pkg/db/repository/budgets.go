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

// ListBudgetsParams drives the List query.
type ListBudgetsParams struct {
	// NamePrefix filters budgets whose display_name starts with this string (case-insensitive).
	NamePrefix string
	// IncludeClosed includes closed budgets when true.
	IncludeClosed bool
	// OrderBy specifies the ordering expression (e.g., "period_start desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// BudgetRepository provides CRUD and specialised queries for the budgets table.
type BudgetRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewBudgetRepository creates a BudgetRepository backed by db.
func NewBudgetRepository(db *gorm.DB) *BudgetRepository {
	return &BudgetRepository{db: db, q: dao.Use(db)}
}

// List returns budgets matching params along with the total count.
func (r *BudgetRepository) List(ctx context.Context, params ListBudgetsParams) ([]*model.Budget, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	b := r.q.Budget.WithContext(ctx)

	if params.NamePrefix != "" {
		b = b.Where(r.q.Budget.DisplayName.Lower().Like(strings.ToLower(params.NamePrefix) + "%"))
	}

	if !params.IncludeClosed {
		b = b.Where(r.q.Budget.IsClosed.Is(false))
	}

	// Get total count before pagination
	total, err := b.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.Budget, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			b = b.Order(expr)
		}
	} else {
		b = b.Order(r.q.Budget.PeriodStart.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		b = b.Offset(offset)
	}
	b = b.Limit(params.PageSize)

	ms, err := b.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the budget with the given ID.
// Returns gorm.ErrRecordNotFound when no such budget exists.
func (r *BudgetRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Budget, error) {
	return r.q.Budget.WithContext(ctx).Where(r.q.Budget.ID.Eq(id)).First()
}

// Create inserts a new budget.
func (r *BudgetRepository) Create(ctx context.Context, m *model.Budget) error {
	return r.q.Budget.WithContext(ctx).Create(m)
}

// Update updates fields of an existing budget matched by its primary key.
func (r *BudgetRepository) Update(ctx context.Context, m *model.Budget) error {
	_, err := r.q.Budget.WithContext(ctx).Where(r.q.Budget.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the budget with the given ID.
func (r *BudgetRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.Budget.WithContext(ctx).Where(r.q.Budget.ID.Eq(id)).Delete()
	return err
}
