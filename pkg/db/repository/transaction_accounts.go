package repository

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

// ListTransactionAccountsParams drives the List query.
type ListTransactionAccountsParams struct {
	// ImportSourceID filters by import source.
	ImportSourceID *uuid.UUID
	// CodePrefix filters by code prefix.
	CodePrefix string
	// OrderBy specifies the ordering expression (e.g., "code asc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// TransactionAccountRepository provides CRUD for transaction_accounts table.
type TransactionAccountRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewTransactionAccountRepository creates a TransactionAccountRepository backed by db.
func NewTransactionAccountRepository(db *gorm.DB) *TransactionAccountRepository {
	return &TransactionAccountRepository{db: db, q: dao.Use(db)}
}

// List returns transaction accounts matching params along with the total count.
func (r *TransactionAccountRepository) List(ctx context.Context, params ListTransactionAccountsParams) ([]*model.TransactionAccount, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	ta := r.q.TransactionAccount.WithContext(ctx)

	if params.ImportSourceID != nil {
		ta = ta.Where(r.q.TransactionAccount.ImportSourceID.Eq(*params.ImportSourceID))
	}

	if params.CodePrefix != "" {
		ta = ta.Where(r.q.TransactionAccount.Code.Lower().Like(strings.ToLower(params.CodePrefix) + "%"))
	}

	// Get total count before pagination
	total, err := ta.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.TransactionAccount, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			ta = ta.Order(expr)
		}
	} else {
		ta = ta.Order(r.q.TransactionAccount.Code.Asc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		ta = ta.Offset(offset)
	}
	ta = ta.Limit(params.PageSize)

	ms, err := ta.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the transaction account with the given ID.
func (r *TransactionAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.TransactionAccount, error) {
	return r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(id)).First()
}

// GetByCode returns the transaction account with the given code.
func (r *TransactionAccountRepository) GetByCode(ctx context.Context, code string) (*model.TransactionAccount, error) {
	return r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.Code.Eq(code)).First()
}

// Create inserts a new transaction account.
func (r *TransactionAccountRepository) Create(ctx context.Context, m *model.TransactionAccount) error {
	return r.q.TransactionAccount.WithContext(ctx).Create(m)
}

// Update updates fields of an existing transaction account.
func (r *TransactionAccountRepository) Update(ctx context.Context, m *model.TransactionAccount) error {
	_, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the transaction account with the given ID.
func (r *TransactionAccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(id)).Delete()
	return err
}
