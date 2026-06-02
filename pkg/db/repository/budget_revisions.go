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

// BudgetRevisionOrderFieldMapper maps API order_by field names to DB column names.
var BudgetRevisionOrderFieldMapper = order.FieldMapper{
	"displayName":        "display_name",
	"displayDescription": "display_description",
	"date":               "date",
	"createTime":         "created_at",
}

// ListBudgetRevisionsParams drives the List query.
type ListBudgetRevisionsParams struct {
	BudgetID uuid.UUID
	Cond     cond.Cond
	OrderBy  []order.Expr
	Page     int
	PageSize int
}

func budgetRevisionColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	case "display_description":
		return "display_description", true
	case "date":
		return "date", true
	default:
		return "", false
	}
}

// BudgetRevisionRepository provides read + create for the budget_revisions table.
type BudgetRevisionRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewBudgetRevisionRepository creates a BudgetRevisionRepository backed by db.
func NewBudgetRevisionRepository(db *gorm.DB) *BudgetRevisionRepository {
	return &BudgetRevisionRepository{db: db, q: dao.Use(db)}
}

// List returns budget revisions for the given budget.
func (r *BudgetRevisionRepository) List(ctx context.Context, params ListBudgetRevisionsParams) ([]*model.BudgetRevision, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("budget_revisions").
		Where("budget_id = ?", params.BudgetID)

	db = cond.Apply(db, params.Cond, budgetRevisionColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("created_at DESC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.BudgetRevision
	if err := db.Find(&ms).Error; err != nil {
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
