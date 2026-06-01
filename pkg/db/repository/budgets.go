package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

// BudgetOrderFieldMapper maps API order_by field names to database column names.
var BudgetOrderFieldMapper = order.FieldMapper{
	"displayName":        "display_name",
	"displayDescription": "display_description",
	"isClosed":           "is_closed",
	"periodStart":        "period_start",
	"periodEnd":          "period_end",
	"createTime":         "created_at",
	"updateTime":         "updated_at",
}

// ListBudgetsParams drives the List query.
type ListBudgetsParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// budgetColumnMapper maps filter field names to database column names.
func budgetColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	case "is_closed":
		return "is_closed", true
	default:
		return "", false
	}
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

	var db *gorm.DB

	// When condition chain is present, use raw GORM for flexible SQL
	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = r.db.WithContext(ctx).Table("budgets")

		// Apply abstract condition chain
		db = cond.Apply(db, params.Cond, budgetColumnMapper)
	} else {
		// Use generated query builder for simple filters
		b := r.q.Budget.WithContext(ctx)

		db = b.UnderlyingDB()
	}

	// Get total count before pagination
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("period_start DESC")
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.Budget
	if err := db.Find(&ms).Error; err != nil {
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
