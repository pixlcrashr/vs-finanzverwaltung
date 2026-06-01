package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

// TransactionAccountOrderFieldMapper maps API order_by field names to database column names.
var TransactionAccountOrderFieldMapper = order.FieldMapper{
	"code":        "code",
	"displayName": "display_name",
	"createTime":  "created_at",
	"updateTime":  "updated_at",
}

// ListTransactionAccountsParams drives the List query.
type ListTransactionAccountsParams struct {
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// transactionAccountColumnMapper maps filter field names to database column names.
func transactionAccountColumnMapper(field string) (string, bool) {
	switch field {
	case "import_source_id":
		return "import_source_id", true
	case "code":
		return "code", true
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
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

	db := r.db.WithContext(ctx).Table("transaction_accounts")

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, transactionAccountColumnMapper)

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("code ASC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.TransactionAccount
	if err := db.Find(&ms).Error; err != nil {
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
