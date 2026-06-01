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

// ListAccountGroupAssignmentsParams drives the List query.
type ListAccountGroupAssignmentsParams struct {
	AccountGroupID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction (e.g. "createTime desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// accountGroupAssignmentColumnMapper maps filter field names to database column names.
func accountGroupAssignmentColumnMapper(field string) (string, bool) {
	switch field {
	case "account_id":
		return "account_id", true
	case "negate":
		return "negate", true
	default:
		return "", false
	}
}

// AccountGroupAssignmentRepository provides CRUD for account_group_assignments table.
type AccountGroupAssignmentRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewAccountGroupAssignmentRepository(db *gorm.DB) *AccountGroupAssignmentRepository {
	return &AccountGroupAssignmentRepository{db: db, q: dao.Use(db)}
}

func (r *AccountGroupAssignmentRepository) List(ctx context.Context, params ListAccountGroupAssignmentsParams) ([]*model.AccountGroupAssignment, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("account_group_assignments").
		Where("account_group_id = ?", params.AccountGroupID)

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, accountGroupAssignmentColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = db.Order("created_at DESC")
	} else {
		if exprs := ResolveOrderBy(&r.q.AccountGroupAssignment, params.OrderBy); len(exprs) > 0 {
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

	var ms []*model.AccountGroupAssignment
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

func (r *AccountGroupAssignmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.AccountGroupAssignment, error) {
	return r.q.AccountGroupAssignment.WithContext(ctx).Where(r.q.AccountGroupAssignment.ID.Eq(id)).First()
}

func (r *AccountGroupAssignmentRepository) Create(ctx context.Context, m *model.AccountGroupAssignment) error {
	return r.q.AccountGroupAssignment.WithContext(ctx).Create(m)
}

func (r *AccountGroupAssignmentRepository) Update(ctx context.Context, m *model.AccountGroupAssignment) error {
	_, err := r.q.AccountGroupAssignment.WithContext(ctx).Where(r.q.AccountGroupAssignment.ID.Eq(m.ID)).Updates(m)
	return err
}

func (r *AccountGroupAssignmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.AccountGroupAssignment.WithContext(ctx).Where(r.q.AccountGroupAssignment.ID.Eq(id)).Delete()
	return err
}
