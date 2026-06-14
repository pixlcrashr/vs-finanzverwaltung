package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

var (
	ErrTransactionAccountAssignmentNotFound      = errors.New("transaction account assignment not found")
	ErrTransactionAccountAssignmentAlreadyExists = errors.New("transaction account assignment already exists")
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
		return nil, 0, fmt.Errorf("count transaction account assignments transaction_id=%s: %w", params.TransactionID, err)
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
		return nil, 0, fmt.Errorf("list transaction account assignments transaction_id=%s: %w", params.TransactionID, err)
	}

	return ms, total, nil
}

func (r *TransactionAccountAssignmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.TransactionAccountAssignment, error) {
	m, err := r.q.TransactionAccountAssignment.WithContext(ctx).Where(r.q.TransactionAccountAssignment.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrTransactionAccountAssignmentNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get transaction account assignment id=%s: %w", id, err)
	}
	return m, nil
}

// CreateTransactionAccountAssignmentParams holds the fields required to create a transaction account assignment.
type CreateTransactionAccountAssignmentParams struct {
	OrganizationID uuid.UUID
	TransactionID  uuid.UUID
	AccountID      uuid.UUID
	Value          apd.Decimal
	CustomID       string
}

func (r *TransactionAccountAssignmentRepository) Create(ctx context.Context, params CreateTransactionAccountAssignmentParams) (*model.TransactionAccountAssignment, error) {
	txCount, err := r.q.Transaction_.WithContext(ctx).Where(r.q.Transaction_.ID.Eq(params.TransactionID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create transaction account assignment: check transaction transaction_id=%s: %w", params.TransactionID, err)
	}
	if txCount == 0 {
		return nil, errors.Join(ErrTransactionNotFound, fmt.Errorf("transaction_id=%s: %w", params.TransactionID, gorm.ErrRecordNotFound))
	}
	accountCount, err := r.q.Account.WithContext(ctx).Where(r.q.Account.ID.Eq(params.AccountID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create transaction account assignment: check account account_id=%s: %w", params.AccountID, err)
	}
	if accountCount == 0 {
		return nil, errors.Join(ErrAccountNotFound, fmt.Errorf("account_id=%s: %w", params.AccountID, gorm.ErrRecordNotFound))
	}
	m := &model.TransactionAccountAssignment{
		OrganizationID: params.OrganizationID,
		TransactionID:  params.TransactionID,
		AccountID:      params.AccountID,
		Value:          params.Value,
		CustomID:       params.CustomID,
	}
	if err := r.q.TransactionAccountAssignment.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrTransactionAccountAssignmentAlreadyExists, fmt.Errorf("transaction_id=%s account_id=%s: %w", m.TransactionID, m.AccountID, err))
		}
		return nil, fmt.Errorf("create transaction account assignment transaction_id=%s account_id=%s: %w", m.TransactionID, m.AccountID, err)
	}
	return m, nil
}

func (r *TransactionAccountAssignmentRepository) Update(ctx context.Context, m *model.TransactionAccountAssignment) error {
	_, err := r.q.TransactionAccountAssignment.WithContext(ctx).Where(r.q.TransactionAccountAssignment.ID.Eq(m.ID)).Updates(m)
	if err != nil {
		return fmt.Errorf("update transaction account assignment id=%s: %w", m.ID, err)
	}
	return nil
}

func (r *TransactionAccountAssignmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.TransactionAccountAssignment.WithContext(ctx).Where(r.q.TransactionAccountAssignment.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete transaction account assignment id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrTransactionAccountAssignmentNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
