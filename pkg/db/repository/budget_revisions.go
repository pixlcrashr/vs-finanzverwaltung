package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

// BudgetRevisionOrderFieldMapper maps API order_by field names to DB column names.
var BudgetRevisionOrderFieldMapper = order.FieldMapper{
	"display_name":        "display_name",
	"display_description": "display_description",
	"date":                "date",
	"create_time":         "created_at",
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

// CreateWithSnapshotParams holds the fields required to create a budget revision with a snapshot.
type CreateWithSnapshotParams struct {
	OrganizationID     uuid.UUID
	BudgetID           uuid.UUID
	DisplayName        string
	DisplayDescription string
	Date               time.Time
}

// CreateWithSnapshot inserts a new revision from params and copies the current budget account
// values as budget revision account values, all within a single transaction.
func (r *BudgetRevisionRepository) CreateWithSnapshot(ctx context.Context, params CreateWithSnapshotParams) (*model.BudgetRevision, error) {
	m := &model.BudgetRevision{
		OrganizationID:     params.OrganizationID,
		BudgetID:           params.BudgetID,
		DisplayName:        params.DisplayName,
		DisplayDescription: params.DisplayDescription,
		Date:               params.Date,
	}

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		q := dao.Use(tx)

		if err := q.BudgetRevision.WithContext(ctx).Create(m); err != nil {
			return err
		}

		var bavs []*model.BudgetAccountValue
		if err := tx.Table("budget_account_values").
			Where("budget_id = ?", m.BudgetID).
			Find(&bavs).Error; err != nil {
			return err
		}

		if len(bavs) == 0 {
			return nil
		}

		ravs := make([]*model.BudgetRevisionAccountValue, 0, len(bavs))
		for _, bav := range bavs {
			ravs = append(ravs, &model.BudgetRevisionAccountValue{
				OrganizationID: m.OrganizationID,
				BudgetTagID:    m.ID,
				AccountID:      bav.AccountID,
				Value:          bav.Value,
			})
		}
		return q.BudgetRevisionAccountValue.WithContext(ctx).Create(ravs...)
	})
	if err != nil {
		return nil, err
	}
	return m, nil
}
