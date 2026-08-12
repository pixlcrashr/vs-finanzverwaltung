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
	"github.com/theater-improrama/go-utils/optional"
	"gorm.io/gen/field"
	"gorm.io/gorm"
)

var (
	ErrAccountGroupNotFound      = errors.New("account group not found")
	ErrAccountGroupAlreadyExists = errors.New("account group already exists")
)

// AccountGroupOrderFieldMapper maps API order_by field names to database column names.
var AccountGroupOrderFieldMapper = order.FieldMapper{
	"displayName":        "display_name",
	"displayDescription": "display_description",
	"createTime":         "created_at",
	"updateTime":         "updated_at",
}

// ListAccountGroupsParams drives the List query.
type ListAccountGroupsParams struct {
	// OrganizationID scopes the query to a specific organization.
	OrganizationID uuid.UUID
	// Cond is an optional abstract condition chain (AND/OR/NOT support).
	Cond cond.Cond
	// OrderBy specifies the sort field and direction as SQL expressions.
	OrderBy []order.Expr
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
}

// accountGroupColumnMapper maps filter field names to database column names.
func accountGroupColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "display_name", true
	default:
		return "", false
	}
}

// AccountGroupRepository provides CRUD and specialised queries for the account_groups table.
type AccountGroupRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewAccountGroupRepository creates an AccountGroupRepository backed by db.
func NewAccountGroupRepository(db *gorm.DB) *AccountGroupRepository {
	return &AccountGroupRepository{db: db, q: dao.Use(db)}
}

// List returns account groups matching params along with the total count.
func (r *AccountGroupRepository) List(ctx context.Context, params ListAccountGroupsParams) ([]*model.AccountGroup, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	db := r.db.WithContext(ctx).Table("account_groups")

	// Scope to organization
	if params.OrganizationID != uuid.Nil {
		db = db.Where("organization_id = ?", params.OrganizationID)
	}

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, accountGroupColumnMapper)

	// Get total count before pagination
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count account groups organization_id=%s: %w", params.OrganizationID, err)
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

	var ms []*model.AccountGroup
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("list account groups organization_id=%s: %w", params.OrganizationID, err)
	}

	return ms, total, nil
}

func (r *AccountGroupRepository) GetByResourceName(ctx context.Context, organization string, accountGroup string) (*model.AccountGroup, error) {
	var orgID uuid.UUID
	orgID, _ = uuid.Parse(organization)

	o, err := r.q.Organization.WithContext(ctx).Where(
		field.Or(
			r.q.Organization.CustomID.Eq(organization),
			r.q.Organization.ID.Eq(orgID),
		),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization=%s: %w", organization, err))
		}
		return nil, fmt.Errorf("get organization organization=%s: %w", organization, err)
	}

	var accountGroupID uuid.UUID
	accountGroupID, _ = uuid.Parse(accountGroup)

	ag, err := r.q.AccountGroup.WithContext(ctx).Where(
		r.q.AccountGroup.OrganizationID.Eq(o.ID),
		field.Or(
			r.q.AccountGroup.CustomID.Eq(accountGroup),
			r.q.AccountGroup.ID.Eq(accountGroupID),
		),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrAccountGroupNotFound, fmt.Errorf("account_group=%s: %w", accountGroup, err))
		}
		return nil, fmt.Errorf("get account group account_group=%s: %w", accountGroup, err)
	}

	return ag, nil
}

// GetByID returns the account group with the given ID.
func (r *AccountGroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.AccountGroup, error) {
	m, err := r.q.AccountGroup.WithContext(ctx).Where(r.q.AccountGroup.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrAccountGroupNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get account group id=%s: %w", id, err)
	}
	return m, nil
}

// GetByCustomID returns the account group with the given custom ID within an organization.
func (r *AccountGroupRepository) GetByCustomID(ctx context.Context, orgID uuid.UUID, customID string) (*model.AccountGroup, error) {
	m, err := r.q.AccountGroup.WithContext(ctx).Where(
		r.q.AccountGroup.OrganizationID.Eq(orgID),
		r.q.AccountGroup.CustomID.Eq(customID),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrAccountGroupNotFound, fmt.Errorf("organization_id=%s custom_id=%s: %w", orgID, customID, err))
		}
		return nil, fmt.Errorf("get account group organization_id=%s custom_id=%s: %w", orgID, customID, err)
	}
	return m, nil
}

// CreateAccountGroupParams holds the fields required to create an account group.
type CreateAccountGroupParams struct {
	OrganizationID     uuid.UUID
	DisplayName        string
	DisplayDescription string
	CustomID           string
}

// Create inserts a new account group.
func (r *AccountGroupRepository) Create(ctx context.Context, params CreateAccountGroupParams) (*model.AccountGroup, error) {
	orgCount, err := r.q.Organization.WithContext(ctx).Where(r.q.Organization.ID.Eq(params.OrganizationID)).Count()
	if err != nil {
		return nil, fmt.Errorf("create account group: check organization organization_id=%s: %w", params.OrganizationID, err)
	}
	if orgCount == 0 {
		return nil, errors.Join(ErrOrganizationNotFound, fmt.Errorf("organization_id=%s: %w", params.OrganizationID, gorm.ErrRecordNotFound))
	}
	m := &model.AccountGroup{
		OrganizationID:     params.OrganizationID,
		DisplayName:        params.DisplayName,
		DisplayDescription: params.DisplayDescription,
		CustomID:           params.CustomID,
	}
	if err := r.q.AccountGroup.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrAccountGroupAlreadyExists, fmt.Errorf("organization_id=%s custom_id=%s: %w", m.OrganizationID, m.CustomID, err))
		}
		return nil, fmt.Errorf("create account group organization_id=%s custom_id=%s: %w", m.OrganizationID, m.CustomID, err)
	}
	return m, nil
}

// UpdateAccountGroupParams holds the fields that can be updated for an account group.
type UpdateAccountGroupParams struct {
	DisplayName        optional.Optional[string]
	DisplayDescription optional.Optional[string]
	CustomID           optional.Optional[string]
}

// Update updates fields of an existing account group matched by its primary key.
func (r *AccountGroupRepository) Update(ctx context.Context, id uuid.UUID, params UpdateAccountGroupParams) error {
	var cols []field.AssignExpr

	if params.DisplayName.IsSet {
		cols = append(cols, r.q.AccountGroup.DisplayName.Value(params.DisplayName.Value))
	}

	if params.DisplayDescription.IsSet {
		cols = append(cols, r.q.AccountGroup.DisplayDescription.Value(params.DisplayDescription.Value))
	}

	if params.CustomID.IsSet {
		cols = append(cols, r.q.AccountGroup.CustomID.Value(params.CustomID.Value))
	}

	if len(cols) == 0 {
		return nil
	}

	if _, err := r.q.AccountGroup.WithContext(ctx).Where(r.q.AccountGroup.ID.Eq(id)).UpdateSimple(cols...); err != nil {
		return fmt.Errorf("update account group id=%s: %w", id, err)
	}

	return nil
}

// Delete removes the account group with the given ID.
func (r *AccountGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.AccountGroup.WithContext(ctx).Where(r.q.AccountGroup.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete account group id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrAccountGroupNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}
	return nil
}
