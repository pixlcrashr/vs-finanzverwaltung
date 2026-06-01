package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

// TransactionAccountAssignmentOrderFieldMapper maps API order_by field names to database column names.
var TransactionAccountAssignmentOrderFieldMapper = order.FieldMapper{
	"accountId":  "account_id",
	"value":      "value",
	"createTime": "created_at",
	"updateTime": "updated_at",
}

// ListTransactionAccountAssignmentsParams drives the List query.
type ListTransactionAccountAssignmentsParams struct {
	TransactionID uuid.UUID
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

type TransactionAccountAssignmentRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewTransactionAccountAssignmentRepository(db *gorm.DB) *TransactionAccountAssignmentRepository {
	return &TransactionAccountAssignmentRepository{db: db, q: dao.Use(db)}
}

func (r *TransactionAccountAssignmentRepository) List(ctx context.Context, params ListTransactionAccountAssignmentsParams) ([]*model.TransactionAccountAssignment, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("transaction_account_assignments").
		Where("transaction_id = ?", params.TransactionID)

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
		db = db.Order("created_at DESC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.TransactionAccountAssignment
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

func (r *TransactionAccountAssignmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.TransactionAccountAssignment, error) {
	return r.q.TransactionAccountAssignment.WithContext(ctx).Where(r.q.TransactionAccountAssignment.ID.Eq(id)).First()
}

func (r *TransactionAccountAssignmentRepository) Create(ctx context.Context, m *model.TransactionAccountAssignment) error {
	return r.q.TransactionAccountAssignment.WithContext(ctx).Create(m)
}

func (r *TransactionAccountAssignmentRepository) Update(ctx context.Context, m *model.TransactionAccountAssignment) error {
	_, err := r.q.TransactionAccountAssignment.WithContext(ctx).Where(r.q.TransactionAccountAssignment.ID.Eq(m.ID)).Updates(m)
	return err
}

func (r *TransactionAccountAssignmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.TransactionAccountAssignment.WithContext(ctx).Where(r.q.TransactionAccountAssignment.ID.Eq(id)).Delete()
	return err
}
