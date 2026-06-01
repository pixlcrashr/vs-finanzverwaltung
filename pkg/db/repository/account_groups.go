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

// AccountGroupOrderFieldMapper maps API order_by field names to database column names.
var AccountGroupOrderFieldMapper = order.FieldMapper{
	"displayName":        "display_name",
	"displayDescription": "display_description",
	"createTime":         "created_at",
	"updateTime":         "updated_at",
}

// ListAccountGroupsParams drives the List query.
type ListAccountGroupsParams struct {
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

	// Apply abstract condition chain
	db = cond.Apply(db, params.Cond, accountGroupColumnMapper)

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

	var ms []*model.AccountGroup
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, err
	}

	return ms, total, nil
}

// GetByID returns the account group with the given ID.
// Returns gorm.ErrRecordNotFound when no such account group exists.
func (r *AccountGroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.AccountGroup, error) {
	return r.q.AccountGroup.WithContext(ctx).Where(r.q.AccountGroup.ID.Eq(id)).First()
}

// Create inserts a new account group.
func (r *AccountGroupRepository) Create(ctx context.Context, m *model.AccountGroup) error {
	return r.q.AccountGroup.WithContext(ctx).Create(m)
}

// Update updates fields of an existing account group matched by its primary key.
func (r *AccountGroupRepository) Update(ctx context.Context, m *model.AccountGroup) error {
	_, err := r.q.AccountGroup.WithContext(ctx).Where(r.q.AccountGroup.ID.Eq(m.ID)).Updates(m)
	return err
}

// Delete removes the account group with the given ID.
func (r *AccountGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.q.AccountGroup.WithContext(ctx).Where(r.q.AccountGroup.ID.Eq(id)).Delete()
	return err
}
