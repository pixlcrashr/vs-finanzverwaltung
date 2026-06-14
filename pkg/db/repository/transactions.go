package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrTransactionNotFound      = errors.New("transaction not found")
	ErrTransactionAlreadyExists = errors.New("transaction already exists")
)

// ListTransactionsParams drives the List query with keyset pagination.
type ListTransactionsParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// KeysetValues for keyset pagination cursor.
	KeysetValues []pagetoken.KeysetValue
	// PageSize caps the number of rows returned.
	PageSize int
	// Offset skips the first N rows (used for offset-based pagination).
	Offset int
}

// transactionColumnMapper maps filter field names to database column names.
func transactionColumnMapper(field string) (string, bool) {
	switch field {
	case "credit_transaction_account_id":
		return "credit_transaction_account_id", true
	case "debit_transaction_account_id":
		return "debit_transaction_account_id", true
	case "booked_at":
		return "booked_at", true
	default:
		return "", false
	}
}

// TransactionRepository provides CRUD and specialised queries for the transactions table.
type TransactionRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewTransactionRepository creates a TransactionRepository backed by db.
func NewTransactionRepository(db *gorm.DB) *TransactionRepository {
	return &TransactionRepository{db: db, q: dao.Use(db)}
}

// fieldToExpr converts a keyset field to a GORM clause expression.
func (r *TransactionRepository) fieldToExpr(field string, value string, op int) (clause.Expression, error) {
	var v any

	switch field {
	case "id":
		id, err := uuid.Parse(value)
		if err != nil {
			return nil, err
		}
		v = id
	case "booked_at":
		t, err := time.Parse(time.RFC3339Nano, value)
		if err != nil {
			return nil, err
		}
		v = t
	case "created_at":
		t, err := time.Parse(time.RFC3339Nano, value)
		if err != nil {
			return nil, err
		}
		v = t
	default:
		return nil, fmt.Errorf("unknown field %q", field)
	}

	switch op {
	case 0: // Eq
		return clause.Eq{Column: field, Value: v}, nil
	case 1: // Lt
		return clause.Lt{Column: field, Value: v}, nil
	case 2: // Gt
		return clause.Gt{Column: field, Value: v}, nil
	default:
		return nil, fmt.Errorf("unknown op %d", op)
	}
}

// List returns transactions matching params using keyset pagination.
func (r *TransactionRepository) List(ctx context.Context, params ListTransactionsParams) ([]*model.Transaction_, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}

	// When condition chain is present, use raw GORM
	if params.Cond != nil && !params.Cond.IsEmpty() {
		db := r.db.WithContext(ctx).Table("transactions")
		db = cond.Apply(db, params.Cond, transactionColumnMapper)

		// Apply default ordering if no keyset
		if len(params.KeysetValues) == 0 {
			db = db.Order("booked_at DESC, id DESC")
		}

		if params.Offset > 0 {
			db = db.Offset(params.Offset)
		}
		db = db.Limit(params.PageSize)

		var ms []*model.Transaction_
		if err := db.Find(&ms).Error; err != nil {
			return nil, fmt.Errorf("list transactions: %w", err)
		}
		return ms, nil
	}

	t := r.q.Transaction_.WithContext(ctx)

	// Apply keyset cursor if present
	if len(params.KeysetValues) > 0 {
		// Build keyset WHERE clause
		var orClauses []clause.Expression
		for i := 0; i < len(params.KeysetValues); i++ {
			var andClauses []clause.Expression

			// Equality conditions for all preceding fields
			for j := 0; j < i; j++ {
				f := params.KeysetValues[j]
				expr, err := r.fieldToExpr(f.Path, f.Value, 0) // Eq
				if err != nil {
					return nil, err
				}
				andClauses = append(andClauses, expr)
			}

			// Inequality condition for current field based on order
			f := params.KeysetValues[i]
			var op int
			if f.Order == order.Desc {
				op = 1 // Lt
			} else {
				op = 2 // Gt
			}
			expr, err := r.fieldToExpr(f.Path, f.Value, op)
			if err != nil {
				return nil, err
			}
			andClauses = append(andClauses, expr)

			if len(andClauses) == 1 {
				orClauses = append(orClauses, andClauses[0])
			} else {
				orClauses = append(orClauses, clause.And(andClauses...))
			}
		}

		if len(orClauses) > 0 {
			t = t.Clauses(clause.Where{
				Exprs: []clause.Expression{clause.Or(orClauses...)},
			})
		}
	}

	// Apply ordering based on keyset fields
	for _, f := range params.KeysetValues {
		field, ok := r.q.Transaction_.GetFieldByName(f.Path)
		if !ok {
			return nil, fmt.Errorf("unknown field %q", f.Path)
		}

		if f.Order == order.Desc {
			t = t.Order(field.Desc())
		} else {
			t = t.Order(field.Asc())
		}
	}

	// Default ordering if no keyset fields
	if len(params.KeysetValues) == 0 {
		t = t.Order(r.q.Transaction_.BookedAt.Desc(), r.q.Transaction_.ID.Desc())
	}

	if params.Offset > 0 {
		t = t.Offset(params.Offset)
	}
	t = t.Limit(params.PageSize)

	ms, err := t.Find()
	if err != nil {
		return nil, fmt.Errorf("list transactions: %w", err)
	}

	return ms, nil
}

// GetByID returns the transaction with the given ID.
func (r *TransactionRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Transaction_, error) {
	m, err := r.q.Transaction_.WithContext(ctx).Where(r.q.Transaction_.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrTransactionNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get transaction id=%s: %w", id, err)
	}
	return m, nil
}

// CreateTransactionParams holds the fields required to create a transaction.
type CreateTransactionParams struct {
	OrganizationID             uuid.UUID
	CreditTransactionAccountID uuid.UUID
	DebitTransactionAccountID  uuid.UUID
	Amount                     apd.Decimal
	Description                string
	Reference                  string
	BookedAt                   time.Time
	DocumentDate               time.Time
	CustomID                   string
}

// Create inserts a new transaction.
func (r *TransactionRepository) Create(ctx context.Context, params CreateTransactionParams) (*model.Transaction_, error) {
	creditCount, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(params.CreditTransactionAccountID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create transaction: check credit account credit_account_id=%s: %w", params.CreditTransactionAccountID, err)
	}
	if creditCount == 0 {
		return nil, errors.Join(ErrTransactionAccountNotFound, fmt.Errorf("credit_account_id=%s: %w", params.CreditTransactionAccountID, gorm.ErrRecordNotFound))
	}
	debitCount, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(params.DebitTransactionAccountID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create transaction: check debit account debit_account_id=%s: %w", params.DebitTransactionAccountID, err)
	}
	if debitCount == 0 {
		return nil, errors.Join(ErrTransactionAccountNotFound, fmt.Errorf("debit_account_id=%s: %w", params.DebitTransactionAccountID, gorm.ErrRecordNotFound))
	}
	m := &model.Transaction_{
		OrganizationID:             params.OrganizationID,
		CreditTransactionAccountID: params.CreditTransactionAccountID,
		DebitTransactionAccountID:  params.DebitTransactionAccountID,
		Amount:                     params.Amount,
		Description:                params.Description,
		Reference:                  params.Reference,
		BookedAt:                   params.BookedAt,
		DocumentDate:               params.DocumentDate,
		CustomID:                   params.CustomID,
	}
	if err := r.q.Transaction_.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrTransactionAlreadyExists, fmt.Errorf("custom_id=%s: %w", m.CustomID, err))
		}
		return nil, fmt.Errorf("create transaction: %w", err)
	}
	return m, nil
}

// Update updates fields of an existing transaction matched by its primary key.
func (r *TransactionRepository) Update(ctx context.Context, m *model.Transaction_) error {
	_, err := r.q.Transaction_.WithContext(ctx).Where(r.q.Transaction_.ID.Eq(m.ID)).Updates(m)
	if err != nil {
		return fmt.Errorf("update transaction id=%s: %w", m.ID, err)
	}
	return nil
}

// Delete removes the transaction with the given ID.
func (r *TransactionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.Transaction_.WithContext(ctx).Where(r.q.Transaction_.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete transaction id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrTransactionNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
