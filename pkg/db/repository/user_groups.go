package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"github.com/theater-improrama/go-utils/optional"
	"gorm.io/gorm"
)

var (
	ErrUserGroupNotFound      = errors.New("user group not found")
	ErrUserGroupAlreadyExists = errors.New("user group already exists")
)

var UserGroupOrderFieldMapper = order.FieldMapper{
	"displayName": "name",
	"createTime":  "created_at",
	"updateTime":  "updated_at",
}

type ListUserGroupsParams struct {
	Cond     cond.Cond
	OrderBy  []order.Expr
	Page     int
	PageSize int
}

func userGroupColumnMapper(field string) (string, bool) {
	switch field {
	case "display_name":
		return "name", true
	default:
		return "", false
	}
}

type CreateUserGroupParams struct {
	DisplayName        string
	DisplayDescription string
	CustomID           string
	// OrganizationPolicies is a map from organization custom ID to the list of
	// proto Permission enum values to grant.
	OrganizationPolicies map[string][]gen.Permission
}

type UpdateUserGroupParams struct {
	DisplayName        optional.Optional[string]
	DisplayDescription optional.Optional[string]
	// OrganizationPolicies, when IsSet, replaces the entire policy set.
	OrganizationPolicies optional.Optional[map[string][]gen.Permission]
}

type UserGroupRepository struct {
	db       *gorm.DB
	q        *dao.Query
	enforcer *authz.Enforcer
}

func NewUserGroupRepository(db *gorm.DB, enforcer *authz.Enforcer) *UserGroupRepository {
	return &UserGroupRepository{db: db, q: dao.Use(db), enforcer: enforcer}
}

func (r *UserGroupRepository) List(ctx context.Context, params ListUserGroupsParams) ([]*model.UserGroup, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	base := r.db.WithContext(ctx).Table("user_groups")

	db := base
	if params.Cond != nil && !params.Cond.IsEmpty() {
		db = cond.Apply(db, params.Cond, userGroupColumnMapper)
	}

	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count user groups: %w", err)
	}

	if len(params.OrderBy) > 0 {
		for _, expr := range params.OrderBy {
			db = db.Order(expr.String())
		}
	} else {
		db = db.Order("name ASC")
	}

	offset := (params.Page - 1) * params.PageSize
	if offset > 0 {
		db = db.Offset(offset)
	}
	db = db.Limit(params.PageSize)

	var ms []*model.UserGroup
	if err := db.Find(&ms).Error; err != nil {
		return nil, 0, fmt.Errorf("list user groups: %w", err)
	}

	return ms, total, nil
}

func (r *UserGroupRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.UserGroup, error) {
	m, err := r.q.UserGroup.WithContext(ctx).Where(r.q.UserGroup.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserGroupNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get user group id=%s: %w", id, err)
	}
	return m, nil
}

func (r *UserGroupRepository) GetByCustomID(ctx context.Context, customID string) (*model.UserGroup, error) {
	m, err := r.q.UserGroup.WithContext(ctx).Where(r.q.UserGroup.CustomID.Eq(customID)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserGroupNotFound, fmt.Errorf("custom_id=%s: %w", customID, err))
		}
		return nil, fmt.Errorf("get user group custom_id=%s: %w", customID, err)
	}
	return m, nil
}

func (r *UserGroupRepository) Create(ctx context.Context, params CreateUserGroupParams) (*model.UserGroup, error) {
	m := &model.UserGroup{
		Name:        params.DisplayName,
		Description: params.DisplayDescription,
		CustomID:    params.CustomID,
	}

	if err := r.q.UserGroup.WithContext(ctx).Create(m); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, errors.Join(ErrUserGroupAlreadyExists, fmt.Errorf("custom_id=%s: %w", m.CustomID, err))
		}
		return nil, fmt.Errorf("create user group: %w", err)
	}

	if params.OrganizationPolicies != nil {
		if err := r.syncPolicies(m.ID.String(), params.OrganizationPolicies); err != nil {
			return nil, fmt.Errorf("create user group sync policies: %w", err)
		}
	}

	return m, nil
}

func (r *UserGroupRepository) Update(ctx context.Context, id uuid.UUID, params UpdateUserGroupParams) error {
	m, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if params.DisplayName.IsSet {
		m.Name = params.DisplayName.Value
	}
	if params.DisplayDescription.IsSet {
		m.Description = params.DisplayDescription.Value
	}

	_, err = r.q.UserGroup.WithContext(ctx).Where(r.q.UserGroup.ID.Eq(m.ID)).Updates(m)
	if err != nil {
		return fmt.Errorf("update user group id=%s: %w", m.ID, err)
	}

	if params.OrganizationPolicies.IsSet {
		if err := r.syncPolicies(m.ID.String(), params.OrganizationPolicies.Value); err != nil {
			return fmt.Errorf("update user group sync policies id=%s: %w", m.ID, err)
		}
	}

	return nil
}

func (r *UserGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result, err := r.q.UserGroup.WithContext(ctx).Where(r.q.UserGroup.ID.Eq(id)).Delete()
	if err != nil {
		return fmt.Errorf("delete user group id=%s: %w", id, err)
	}
	if result.RowsAffected == 0 {
		return errors.Join(ErrUserGroupNotFound, fmt.Errorf("id=%s: %w", id, gorm.ErrRecordNotFound))
	}

	// Remove all casbin policies for this group role.
	if _, err := r.enforcer.RemoveFilteredPolicy(0, id.String()); err != nil {
		return fmt.Errorf("delete user group remove policies id=%s: %w", id, err)
	}

	if err := r.enforcer.Flush(); err != nil {
		return fmt.Errorf("delete user group flush policies id=%s: %w", id, err)
	}

	return nil
}

// syncPolicies replaces all casbin policies for the given group (role = groupID)
// with the provided organization→permissions mapping. It then flushes the enforcer.
//
// Casbin policy format (domain-aware):
//
//	p, <group_uuid>, <org_custom_id>, <resource>, <action>
//
// The organization custom ID is used as the casbin domain so that
// group assignments and policies are scoped per organization.
func (r *UserGroupRepository) syncPolicies(groupID string, policies map[string][]gen.Permission) error {
	// 1. Remove all existing policies for this group.
	if _, err := r.enforcer.RemoveFilteredPolicy(0, groupID); err != nil {
		return fmt.Errorf("remove old policies for group %s: %w", groupID, err)
	}

	// 2. Add new policies.
	for orgCustomID, perms := range policies {
		for _, pp := range perms {
			p, ok := authz.PermissionFromProto(pp)
			if !ok {
				continue
			}
			// Global permissions (users, groups, settings) use empty domain;
			// org-scoped permissions use the organization custom ID.
			dom := orgCustomID
			if authz.GlobalResources[p.Resource] {
				dom = authz.GlobalDomain
			}
			if _, err := r.enforcer.AddPolicy(groupID, dom, p.Resource, p.Action); err != nil {
				return fmt.Errorf("add policy group=%s dom=%s obj=%s act=%s: %w", groupID, dom, p.Resource, p.Action, err)
			}
		}
	}

	// 3. Flush to ensure all consumers see updated policies.
	return r.enforcer.Flush()
}

// GetOrganizationPolicies reads casbin policies for a group and returns them
// as a map from organization custom ID to proto permissions.
func (r *UserGroupRepository) GetOrganizationPolicies(groupID string) (map[string][]gen.Permission, error) {
	perms, err := r.enforcer.GetPermissionsForUser(groupID)
	if err != nil {
		return nil, fmt.Errorf("get permissions for group %s: %w", groupID, err)
	}

	result := make(map[string][]gen.Permission)
	for _, p := range perms {
		// p = [groupID, dom, obj, act]
		if len(p) < 4 {
			continue
		}
		orgCustomID := p[1]
		resource := p[2]
		act := p[3]

		perm := authz.Permission{Resource: resource, Action: act}
		protoPerm, ok := authz.ReversePermissions[perm]
		if !ok {
			continue
		}

		result[orgCustomID] = append(result[orgCustomID], protoPerm)
	}

	return result, nil
}
