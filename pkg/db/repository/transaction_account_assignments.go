package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListTransactionAccountAssignmentsParams drives the List query.
type ListTransactionAccountAssignmentsParams struct {
	TransactionID uuid.UUID
	// OrderBy specifies the ordering expression (e.g., "created_at desc").
	OrderBy order.Fields
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

	taa := r.q.TransactionAccountAssignment.WithContext(ctx).
		Where(r.q.TransactionAccountAssignment.TransactionID.Eq(params.TransactionID))

	total, err := taa.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.TransactionAccountAssignment, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			taa = taa.Order(expr)
		}
	} else {
		taa = taa.Order(r.q.TransactionAccountAssignment.CreatedAt.Desc())
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		taa = taa.Offset(offset)
	}
	taa = taa.Limit(params.PageSize)

	ms, err := taa.Find()
	if err != nil {
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
