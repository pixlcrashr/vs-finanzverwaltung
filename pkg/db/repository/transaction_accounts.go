package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"gorm.io/gorm"
)

var (
	ErrTransactionAccountNotFound      = errors.New("transaction account not found")
	ErrTransactionAccountAlreadyExists = errors.New("transaction account already exists")
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
		return nil, 0, fmt.Errorf("count transaction accounts page=%d: %w", params.Page, err)
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
		return nil, 0, fmt.Errorf("list transaction accounts page=%d: %w", params.Page, err)
	}

	return ms, total, nil
}

// GetByID returns the transaction account with the given ID.
func (r *TransactionAccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.TransactionAccount, error) {
	m, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrTransactionAccountNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get transaction account id=%s: %w", id, err)
	}
	return m, nil
}

// GetByCustomID returns the transaction account with the given custom ID within an organization.
func (r *TransactionAccountRepository) GetByCustomID(ctx context.Context, orgID uuid.UUID, customID string) (*model.TransactionAccount, error) {
	m, err := r.q.TransactionAccount.WithContext(ctx).Where(
		r.q.TransactionAccount.OrganizationID.Eq(orgID),
		r.q.TransactionAccount.CustomID.Eq(customID),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrTransactionAccountNotFound, fmt.Errorf("organization_id=%s custom_id=%s: %w", orgID, customID, err))
		}
		return nil, fmt.Errorf("get transaction account organization_id=%s custom_id=%s: %w", orgID, customID, err)
	}
	return m, nil
}

// GetByCode returns the transaction account with the given code.
func (r *TransactionAccountRepository) GetByCode(ctx context.Context, code string) (*model.TransactionAccount, error) {
	m, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.Code.Eq(code)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrTransactionAccountNotFound, fmt.Errorf("code=%s: %w", code, err))
		}
		return nil, fmt.Errorf("get transaction account code=%s: %w", code, err)
	}
	return m, nil
}

// CreateTransactionAccountParams holds the fields required to create a transaction account.
type CreateTransactionAccountParams struct {
	OrganizationID     uuid.UUID
	ImportSourceID     uuid.UUID
	Code               string
	DisplayName        string
	DisplayDescription string
	CustomID           string
}

// Create inserts a new transaction account.
func (r *TransactionAccountRepository) Create(ctx context.Context, params CreateTransactionAccountParams) (*model.TransactionAccount, error) {
	orgCount, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(params.OrganizationID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create transaction account: check organization organization_id=%s: %w", params.OrganizationID, err)
	}
	if orgCount == 0 {
		return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization_id=%s: %w", params.OrganizationID, gorm.ErrRecordNotFound))
	}
	sourceCount, err := r.q.ImportSource.WithContext(ctx).Where(r.q.ImportSource.ID.Eq(params.ImportSourceID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create transaction account: check import source import_source_id=%s: %w", params.ImportSourceID, err)
	}
	if sourceCount == 0 {
		return nil, errors.Join(ErrImportSourceNotFound, fmt.Errorf("import_source_id=%s: %w", params.ImportSourceID, gorm.ErrRecordNotFound))
	}
	m := &model.TransactionAccount{
		OrganizationID:     params.OrganizationID,
		ImportSourceID:     params.ImportSourceID,
		Code:               params.Code,
		DisplayName:        params.DisplayName,
		DisplayDescription: params.DisplayDescription,
		CustomID:           params.CustomID,
	}
	if err := r.q.TransactionAccount.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrTransactionAccountAlreadyExists, fmt.Errorf("organization_id=%s custom_id=%s code=%s: %w", m.OrganizationID, m.CustomID, m.Code, err))
		}
		return nil, fmt.Errorf("create transaction account custom_id=%s: %w", m.CustomID, err)
	}
	return m, nil
}

// Update updates fields of an existing transaction account.
func (r *TransactionAccountRepository) Update(ctx context.Context, m *model.TransactionAccount) error {
	_, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(m.ID)).Updates(m)
	if err != nil {
		return fmt.Errorf("update transaction account id=%s: %w", m.ID, err)
	}
	return nil
}

// Delete removes the transaction account with the given ID.
func (r *TransactionAccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.TransactionAccount.WithContext(ctx).Where(r.q.TransactionAccount.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete transaction account id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrTransactionAccountNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
