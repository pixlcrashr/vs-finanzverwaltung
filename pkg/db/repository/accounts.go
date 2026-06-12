package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"github.com/theater-improrama/go-utils/optional"
	"gorm.io/gorm"
)

// AccountOrderFieldMapper maps API order_by field names to database column names.
var AccountOrderFieldMapper = order.FieldMapper{
	"displayName":        "display_name",
	"displayCode":        "display_code",
	"displayDescription": "display_description",
	"isContainer":        "is_container",
	"isArchived":         "is_archived",
	"createTime":         "created_at",
	"updateTime":         "updated_at",
}

// ListAccountsParams drives the List query.
type ListAccountsParams struct {
	// OrganizationID restricts results to a single organization.
	OrganizationID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	// When set, it is applied in addition to individual filter fields.
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// accountColumnMapper maps filter field names to database column names.
func accountColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	case "display_code":
		return "display_code", true
	case "is_archived":
		return "is_archived", true
	default:
		return "", false
	}
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

	base := r.db.WithContext(ctx).Table("accounts")
	if params.OrganizationID != (uuid.UUID{}) {
		base = base.Where("organization_id = ?", params.OrganizationID)
	}

	var db *gorm.DB

	// When condition chain is present, use raw GORM for flexible SQL
	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = base

		// Apply abstract condition chain
		db = cond.Apply(db, params.Cond, accountColumnMapper)
	} else {
		db = base
	}

	// Get total count before pagination
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

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.Account
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the account with the given ID.
// Returns gorm.ErrRecordNotFound when no such account exists.
func (r *AccountRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.Account, error) {
	return r.q.Account.WithContext(ctx).Where(r.q.Account.ID.Eq(id)).First()
}

// GetByCustomID returns the account with the given custom ID within an organization.
// Returns gorm.ErrRecordNotFound when no such account exists.
func (r *AccountRepository) GetByCustomID(ctx context.Context, orgID uuid.UUID, customID string) (*model.Account, error) {
	return r.q.Account.WithContext(ctx).Where(
		r.q.Account.OrganizationID.Eq(orgID),
		r.q.Account.CustomID.Eq(customID),
	).First()
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
	result, err := r.q.Account.WithContext(ctx).Where(r.q.Account.ID.Eq(id)).Delete()
	if err != nil {
		return err
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
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

// ListNestedParams drives the ListNested query.
type ListNestedParams struct {
	IsArchived optional.Optional[bool]
}

// ListNested returns accounts for building a hierarchical view.
// If isArchived is set, filters by that status; otherwise returns all accounts.
func (r *AccountRepository) ListNested(ctx context.Context, params ListNestedParams) ([]*model.Account, error) {
	a := r.q.Account.WithContext(ctx)

	if params.IsArchived.IsSet {
		a = a.Where(r.q.Account.IsArchived.Is(params.IsArchived.Value))
	}

	return a.Find()
}

// GetSubtree returns the account and all its descendants starting from rootAccountID.
// If isArchived is set, filters by that status; otherwise returns all accounts.
func (r *AccountRepository) GetSubtree(ctx context.Context, rootAccountID uuid.UUID, isArchived optional.Optional[bool]) ([]*model.Account, error) {
	type row struct {
		ID                 uuid.UUID     `gorm:"column:id"`
		ParentAccountID    uuid.NullUUID `gorm:"column:parent_account_id"`
		DisplayName        string        `gorm:"column:display_name"`
		DisplayCode        string        `gorm:"column:display_code"`
		DisplayDescription string        `gorm:"column:display_description"`
		IsContainer        bool          `gorm:"column:is_container"`
		IsArchived         bool          `gorm:"column:is_archived"`
		UpdatedAt          time.Time     `gorm:"column:updated_at"`
		CreatedAt          time.Time     `gorm:"column:created_at"`
	}

	query := `
WITH RECURSIVE descendants(id, parent_account_id, display_name, display_code, display_description, is_container, is_archived, updated_at, created_at) AS (
    SELECT id, parent_account_id, display_name, display_code, display_description, is_container, is_archived, updated_at, created_at
    FROM accounts
    WHERE id = ?
    UNION
    SELECT a.id, a.parent_account_id, a.display_name, a.display_code, a.display_description, a.is_container, a.is_archived, a.updated_at, a.created_at
    FROM accounts a
    JOIN descendants d ON a.parent_account_id = d.id
)
SELECT * FROM descendants`

	var rows []row
	db := r.db.WithContext(ctx).Raw(query, rootAccountID)
	if err := db.Scan(&rows).Error; err != nil {
		return nil, err
	}

	var result []*model.Account
	for _, r := range rows {
		if isArchived.IsSet && r.IsArchived != isArchived.Value {
			continue
		}
		result = append(result, &model.Account{
			ID:                 r.ID,
			ParentAccountID:    r.ParentAccountID,
			DisplayName:        r.DisplayName,
			DisplayCode:        r.DisplayCode,
			DisplayDescription: r.DisplayDescription,
			IsContainer:        r.IsContainer,
			IsArchived:         r.IsArchived,
			UpdatedAt:          r.UpdatedAt,
			CreatedAt:          r.CreatedAt,
		})
	}
	return result, nil
}
