package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

var (
	ErrBudgetRevisionNotFound      = errors.New("budget revision not found")
	ErrBudgetRevisionAlreadyExists = errors.New("budget revision already exists")
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
		return nil, 0, fmt.Errorf("count budget revisions budget_id=%s: %w", params.BudgetID, err)
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
		return nil, 0, fmt.Errorf("list budget revisions budget_id=%s: %w", params.BudgetID, err)
	}
	return ms, total, nil
}

// GetByID returns the budget revision with the given ID.
func (r *BudgetRevisionRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.BudgetRevision, error) {
	m, err := r.q.BudgetRevision.WithContext(ctx).Where(r.q.BudgetRevision.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrBudgetRevisionNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get budget revision id=%s: %w", id, err)
	}
	return m, nil
}

// GetByCustomID returns the budget revision with the given custom ID within an organization.
func (r *BudgetRevisionRepository) GetByCustomID(ctx context.Context, orgID uuid.UUID, customID string) (*model.BudgetRevision, error) {
	m, err := r.q.BudgetRevision.WithContext(ctx).Where(
		r.q.BudgetRevision.OrganizationID.Eq(orgID),
		r.q.BudgetRevision.CustomID.Eq(customID),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrBudgetRevisionNotFound, fmt.Errorf("organization_id=%s custom_id=%s: %w", orgID, customID, err))
		}
		return nil, fmt.Errorf("get budget revision organization_id=%s custom_id=%s: %w", orgID, customID, err)
	}
	return m, nil
}

// CreateWithSnapshotParams holds the fields required to create a budget revision with a snapshot.
type CreateWithSnapshotParams struct {
	OrganizationID     uuid.UUID
	BudgetID           uuid.UUID
	DisplayName        string
	DisplayDescription string
	Date               time.Time
	CustomID           string
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
		CustomID:           params.CustomID,
	}

	budgetCount, err := r.q.Budget.WithContext(ctx).Where(r.q.Budget.ID.Eq(m.BudgetID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create budget revision: check budget budget_id=%s: %w", m.BudgetID, err)
	}
	if budgetCount == 0 {
		return nil, errors.Join(ErrBudgetNotFound, fmt.Errorf("budget_id=%s: %w", m.BudgetID, gorm.ErrRecordNotFound))
	}

	err = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		q := dao.Use(tx)

		if err := q.BudgetRevision.WithContext(ctx).Create(m); err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				return errors.Join(ErrBudgetRevisionAlreadyExists, fmt.Errorf("budget_id=%s custom_id=%s: %w", m.BudgetID, m.CustomID, err))
			}
			return fmt.Errorf("create budget revision budget_id=%s custom_id=%s: %w", m.BudgetID, m.CustomID, err)
		}

		var bavs []*model.BudgetAccountValue
		if err := tx.Table("budget_account_values").
			Where("budget_id = ?", m.BudgetID).
			Find(&bavs).Error; err != nil {
			return fmt.Errorf("snapshot budget account values budget_id=%s: %w", m.BudgetID, err)
		}

		if len(bavs) == 0 {
			return nil
		}

		ravs := make([]*model.BudgetRevisionAccountValue, 0, len(bavs))
		for _, bav := range bavs {
			ravs = append(ravs, &model.BudgetRevisionAccountValue{
				OrganizationID:   m.OrganizationID,
				BudgetID:         m.BudgetID,
				BudgetRevisionID: m.ID,
				AccountID:        bav.AccountID,
				Value:            bav.Value,
			})
		}
		if err := q.BudgetRevisionAccountValue.WithContext(ctx).Create(ravs...); err != nil {
			return fmt.Errorf("create snapshot revision account values budget_id=%s: %w", m.BudgetID, err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return m, nil
}
