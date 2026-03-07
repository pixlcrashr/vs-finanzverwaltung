package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListAccountGroupAssignmentsParams drives the List query.
type ListAccountGroupAssignmentsParams struct {
	AccountGroupID uuid.UUID
	// AccountID optionally filters assignments by account.
	AccountID *uuid.UUID
	// Negate optionally filters by negate flag.
	Negate *bool
	// OrderBy specifies the sort field and direction (e.g. "createTime desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
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

	aga := r.q.AccountGroupAssignment.WithContext(ctx).
		Where(r.q.AccountGroupAssignment.AccountGroupID.Eq(params.AccountGroupID))

	if params.AccountID != nil {
		aga = aga.Where(r.q.AccountGroupAssignment.AccountID.Eq(*params.AccountID))
	}
	if params.Negate != nil {
		aga = aga.Where(r.q.AccountGroupAssignment.Negate.Is(*params.Negate))
	}

	total, err := aga.Count()
	if err != nil {
		return nil, 0, err
	}

	if exprs := ResolveOrderBy(&r.q.AccountGroupAssignment, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			aga = aga.Order(expr)
		}
	} else {
		aga = aga.Order(r.q.AccountGroupAssignment.CreatedAt.Desc())
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		aga = aga.Offset(offset)
	}
	aga = aga.Limit(params.PageSize)

	ms, err := aga.Find()
	if err != nil {
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
