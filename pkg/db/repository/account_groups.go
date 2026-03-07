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

// ListAccountGroupsParams drives the List query.
type ListAccountGroupsParams struct {
	// NamePrefix filters account groups whose display_name starts with this string (case-insensitive).
	NamePrefix string
	// OrderBy specifies the sort field and direction (e.g. "displayName", "createTime desc").
	OrderBy order.Fields
	// Page number (1-indexed).
	Page int
	// PageSize caps the number of rows returned.
	PageSize int
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

	ag := r.q.AccountGroup.WithContext(ctx)

	if params.NamePrefix != "" {
		ag = ag.Where(r.q.AccountGroup.DisplayName.Lower().Like(strings.ToLower(params.NamePrefix) + "%"))
	}

	// Get total count before pagination
	total, err := ag.Count()
	if err != nil {
		return nil, 0, err
	}

	// Apply ordering
	if exprs := ResolveOrderBy(&r.q.AccountGroup, params.OrderBy); len(exprs) > 0 {
		for _, expr := range exprs {
			ag = ag.Order(expr)
		}
	} else {
		ag = ag.Order(r.q.AccountGroup.CreatedAt.Desc())
	}

	// Apply pagination
	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		ag = ag.Offset(offset)
	}
	ag = ag.Limit(params.PageSize)

	ms, err := ag.Find()
	if err != nil {
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
