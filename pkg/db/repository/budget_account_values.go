package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

// BudgetAccountValueOrderFieldMapper maps API order_by field names to DB column names.
var BudgetAccountValueOrderFieldMapper = order.FieldMapper{
	"accountId":  "account_id",
	"value":      "value",
	"createTime": "created_at",
	"updateTime": "updated_at",
}

// ListBudgetAccountValuesParams drives the List query.
type ListBudgetAccountValuesParams struct {
	BudgetID uuid.UUID
	Cond     cond.Cond
	OrderBy  []order.Expr
	Page     int
	PageSize int
}

func budgetAccountValueColumnMapper(field string) (string, bool) {
	switch field {
	case "account_id":
		return "account_id", true
	default:
		return "", false
	}
}

// BudgetAccountValueRepository provides CRUD for the budget_account_values table.
type BudgetAccountValueRepository struct {
	db *gorm.DB
}

// NewBudgetAccountValueRepository creates a BudgetAccountValueRepository backed by db.
func NewBudgetAccountValueRepository(db *gorm.DB) *BudgetAccountValueRepository {
	return &BudgetAccountValueRepository{db: db}
}

// List returns budget account values for the given budget.
func (r *BudgetAccountValueRepository) List(ctx context.Context, params ListBudgetAccountValuesParams) ([]*model.BudgetAccountValue, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("budget_account_values").
		Where("budget_id = ?", params.BudgetID)

	db = cond.Apply(db, params.Cond, budgetAccountValueColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("created_at ASC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.BudgetAccountValue
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}
	return ms, total, nil
}

// GetByID returns the budget account value with the given ID.
func (r *BudgetAccountValueRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.BudgetAccountValue, error) {
	var m model.BudgetAccountValue
	if err := r.db.WithContext(ctx).Table("budget_account_values").Where("id = ?", id).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// Create inserts a new budget account value.
func (r *BudgetAccountValueRepository) Create(ctx context.Context, m *model.BudgetAccountValue) error {
	return r.db.WithContext(ctx).Create(m).Error
}

// Update saves changes to an existing budget account value.
func (r *BudgetAccountValueRepository) Update(ctx context.Context, m *model.BudgetAccountValue) error {
	return r.db.WithContext(ctx).Save(m).Error
}

// Delete removes the budget account value with the given ID.
func (r *BudgetAccountValueRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Table("budget_account_values").Where("id = ?", id).Delete(&model.BudgetAccountValue{}).Error
}
