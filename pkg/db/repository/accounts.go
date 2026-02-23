package repository

import (
	"context"
	"database/sql/driver"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken"
	ptGorm "github.com/pixlcrashr/go-pagetoken/database/gorm"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/samber/lo"
	"gorm.io/gen"
	"gorm.io/gen/field"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// OrderDir indicates sort direction.
type OrderDir int

const (
	OrderAsc OrderDir = iota
	OrderDesc
)

// OrderField describes one term in an ORDER BY clause.
type OrderField struct {
	Path string
	Dir  OrderDir
}

// CursorField carries one keyset boundary value.
// Value must be the Go type that GORM will bind correctly for the column
// (e.g. uuid.UUID for id, string for display_name, time.Time for timestamps).
type CursorField struct {
	Path  field.Field
	Value driver.Valuer
	Dir   OrderDir
}

// ListAccountsOpts drives the List query.
type ListAccountsOpts struct {
	// NamePrefix filters accounts whose display_name starts with this string (case-sensitive).
	NamePrefix string
	// IncludeArchived includes archived accounts when true.
	IncludeArchived bool
	// KeysetFields defines the sort order.
	KeysetFields []pagetoken.KeysetField
	// Limit caps the number of rows returned.
	Limit int
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

func (r *AccountRepository) fieldToExpr(field string, value string, op ptGorm.KeysetFieldOp) (clause.Expression, error) {
	var v any

	switch field {
	case r.q.Account.ID.ColumnName().String():
		id, err := uuid.Parse(value)
		if err != nil {
			return nil, err
		}

		v = id
	case r.q.Account.CreatedAt.ColumnName().String():
		t, err := time.Parse(time.RFC3339Nano, value)
		if err != nil {
			return nil, err
		}

		v = t
	default:
		return nil, fmt.Errorf("unknown field %q", field)
	}

	switch op {
	case ptGorm.KeysetFieldOpEq:
		return clause.Eq{Column: field, Value: v}, nil
	case ptGorm.KeysetFieldOpLt:
		return clause.Lt{Column: field, Value: v}, nil
	case ptGorm.KeysetFieldOpGt:
		return clause.Gt{Column: field, Value: v}, nil
	default:
		return nil, fmt.Errorf("unknown op %d", op)
	}
}

// List returns accounts matching opts.
func (r *AccountRepository) List(ctx context.Context, opts ListAccountsOpts) ([]*model.Account, error) {
	if opts.Limit <= 0 {
		opts.Limit = 20
	}

	a := r.q.Account.WithContext(ctx)

	if opts.NamePrefix != "" {
		a = a.Where(r.q.Account.DisplayName.Like(opts.NamePrefix + "%"))
	}

	if !opts.IncludeArchived {
		a = a.Where(r.q.Account.IsArchived.Is(false))
	}

	e, err := ptGorm.KeysetFieldsExpr(opts.KeysetFields, r.fieldToExpr)
	if err != nil {
		return nil, err
	}

	if e != nil {
		a = a.Clauses(clause.Where{
			Exprs: []clause.Expression{e},
		})
	}

	for _, o := range opts.KeysetFields {
		f, ok := r.q.Account.GetFieldByName(o.Path)
		if !ok {
			return nil, fmt.Errorf("unknown field %q", o.Path)
		}

		if o.Order == pagetoken.OrderDesc {
			a = a.Order(f.Desc())
		} else {
			a = a.Order(f.Asc())
		}
	}

	if len(opts.KeysetFields) == 0 {
		a = a.Order(r.q.Account.CreatedAt.Desc())
	}

	if opts.Limit > 0 {
		a = a.Limit(opts.Limit)
	}

	ms, err := a.Find()
	if err != nil {
		return nil, err
	}

	return ms, nil
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

// Save updates all fields of an existing account matched by its primary key.
func (r *AccountRepository) Save(ctx context.Context, m *model.Account) error {
	return r.q.Account.WithContext(ctx).Save(m)
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

// ---------------------------------------------------------------------------
// Keyset helpers
// ---------------------------------------------------------------------------

// accountColumns maps API field paths to DB column names for the accounts table.
// Only paths present here are accepted; this prevents SQL injection.
var accountColumns = map[string]string{
	"id":           "id",
	"display_name": "display_name",
	"display_code": "display_code",
	"created_at":   "created_at",
	"updated_at":   "updated_at",
}

// buildKeysetClause builds a WHERE clause for keyset (seek) pagination.
//
// For cursor fields [(a, asc, va), (b, desc, vb), (c, asc, vc)] it produces:
//
//	(a > va) OR (a = va AND b < vb) OR (a = va AND b = vb AND c > vc)
func buildKeysetClause(fields []CursorField) gen.Condition {
	if len(fields) == 0 {
		return nil
	}

	return field.And(
		lo.Map(fields, func(f CursorField, _ int) field.Expr {
			if f.Dir == OrderDesc {
				return f.Path.Lte(f.Value)
			}

			return f.Path.Gte(f.Value)
		})...,
	)
}
