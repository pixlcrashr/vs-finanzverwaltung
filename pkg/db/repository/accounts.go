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

// ListAccountsParams drives the List query.
type ListAccountsParams struct {
	// NamePrefix filters accounts whose display_name starts with this string (case-insensitive).
	NamePrefix string
	// IncludeArchived includes archived accounts when true.
	IncludeArchived bool
	// OrderBy specifies the sort field and direction (e.g. "displayName", "createTime desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// AccountRepository provides CRUD and specialised queries for the accounts table.
type AccountRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewAccountRepository creates an AccountRepository backed by db.
func NewAccountRepository(db *gorm.DB) *AccountRepository {
	return &AccountRepository{db: db, q: dao.Use(db)}
}

// List returns accounts matching params along with the total count.
func (r *AccountRepository) List(ctx context.Context, params ListAccountsParams) ([]*model.Account, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	a := r.q.Account.WithContext(ctx)

	if params.NamePrefix != "" {
		a = a.Where(r.q.Account.DisplayName.Lower().Like("%" + strings.ToLower(params.NamePrefix) + "%"))
	}

	if !params.IncludeArchived {
		a = a.Where(r.q.Account.IsArchived.Is(false))
	}

	// Get total count before pagination
	total, err := a.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.Account, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			a = a.Order(expr)
		}
	} else {
		a = a.Order(r.q.Account.CreatedAt.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		a = a.Offset(offset)
	}
	a = a.Limit(params.PageSize)

	ms, err := a.Find()
	if err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the account with the given ID.
// Returns gorm.ErrRecordNotFound when no such account exists.
func (r *AccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Account, error) {
	return r.q.Account.WithContext(ctx).Where(r.q.Account.ID.Eq(id)).First()
}

// Create inserts a new account.
func (r *AccountRepository) Create(ctx context.Context, m *model.Account) error {
	return r.q.Account.WithContext(ctx).Create(m)
}

// Update updates fields of an existing account matched by its primary key.
func (r *AccountRepository) Update(ctx context.Context, m *model.Account) error {
	_, err := r.q.Account.WithContext(ctx).Where(r.q.Account.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the account with the given ID.
func (r *AccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.Account.WithContext(ctx).Where(r.q.Account.ID.Eq(id)).Delete()
	return err
}

// HasAncestor reports whether candidateAncestorID appears anywhere in the ancestor
// chain of accountID. Used to detect cycles before reparenting an account.
func (r *AccountRepository) HasAncestor(ctx context.Context, accountID, candidateAncestorID uuid.UUID) (bool, error) {
	type row struct {
		HasCycle bool `gorm:"column:has_cycle"`
	}
	var res row
	err := r.db.WithContext(ctx).Raw(`
WITH RECURSIVE ancestors(id, parent_id) AS (
    SELECT id, parent_account_id FROM accounts WHERE id = ?
    UNION
    SELECT a.id, a.parent_account_id
    FROM accounts a
    JOIN ancestors an ON a.id = an.parent_id
)
SELECT EXISTS (SELECT 1 FROM ancestors WHERE id = ?) AS has_cycle
`, accountID, candidateAncestorID).Scan(&res).Error
	return res.HasCycle, err
}

// HasTransactionAssignments reports whether any transaction_account_assignments
// row references the given account. Used to block creating children under accounts
// that already have direct transaction assignments.
func (r *AccountRepository) HasTransactionAssignments(ctx context.Context, accountID uuid.UUID) (bool, error) {
	count, err := r.q.TransactionAccountAssignment.WithContext(ctx).
		Where(r.q.TransactionAccountAssignment.AccountID.Eq(accountID)).
		Count()
	return count > 0, err
}
