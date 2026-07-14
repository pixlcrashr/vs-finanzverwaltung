package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"github.com/theater-improrama/go-utils/optional"
	"gorm.io/gorm"
)

var (
	ErrUserGroupNotFound      = errors.New("user group not found")
	ErrUserGroupAlreadyExists = errors.New("user group already exists")
	ErrUserGroupIsSystem      = errors.New("user group is a system group and cannot be modified")
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
	// Organizations is a list of organization resource names
	// (e.g. "organizations/{org}")
	Organizations []string
	// Permissions is a list of "resource:action" strings.
	Permissions []string
}

type UpdateUserGroupParams struct {
	DisplayName        optional.Optional[string]
	DisplayDescription optional.Optional[string]
	// Organizations, when IsSet, replaces all group-to-organization assignments.
	Organizations optional.Optional[[]string]
	// Permissions, when IsSet, replaces all permissions.
	Permissions optional.Optional[[]string]
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

	if params.Organizations != nil || params.Permissions != nil {
		if err := r.syncAssignmentsAndPolicies(ctx, m.ID, params.Organizations, params.Permissions); err != nil {
			return nil, fmt.Errorf("create user group sync: %w", err)
		}
	}

	return m, nil
}

func (r *UserGroupRepository) Update(ctx context.Context, id uuid.UUID, params UpdateUserGroupParams) error {
	m, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if m.IsSystem {
		return errors.Join(ErrUserGroupIsSystem, fmt.Errorf("id=%s", id))
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

	if params.Organizations.IsSet || params.Permissions.IsSet {
		var orgs []string
		var perms []string
		if params.Organizations.IsSet {
			orgs = params.Organizations.Value
		}
		if params.Permissions.IsSet {
			perms = params.Permissions.Value
		}
		if err := r.syncAssignmentsAndPolicies(ctx, m.ID, orgs, perms); err != nil {
			return fmt.Errorf("update user group sync id=%s: %w", m.ID, err)
		}
	}

	return nil
}

func (r *UserGroupRepository) Delete(ctx context.Context, id uuid.UUID) error {
	m, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if m.IsSystem {
		return errors.Join(ErrUserGroupIsSystem, fmt.Errorf("id=%s", id))
	}

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

	// Remove all casbin g3 assignments for this group.
	if _, err := r.enforcer.RemoveAllGroupOrgAssignments(id.String()); err != nil {
		return fmt.Errorf("delete user group remove org assignments id=%s: %w", id, err)
	}

	if err := r.enforcer.Flush(); err != nil {
		return fmt.Errorf("delete user group flush policies id=%s: %w", id, err)
	}

	return nil
}

// syncAssignmentsAndPolicies replaces all group-to-organization assignments
// (both in the GORM table and casbin g3) and all casbin policies (p) for the
// given group. It then flushes the enforcer.
//
// GORM table is the source of truth for org assignments; casbin g3 is synced
// from it. Casbin p policies are self-standing (no domain).
func (r *UserGroupRepository) syncAssignmentsAndPolicies(ctx context.Context, groupID uuid.UUID, organizations, permissions []string) error {
	groupIDStr := groupID.String()

	// 1. Sync GORM table (source of truth for org assignments).
	if organizations != nil {
		// Delete existing assignments.
		if err := r.db.WithContext(ctx).Where("user_group_id = ?", groupID).Delete(&model.GroupOrganization{}).Error; err != nil {
			return fmt.Errorf("delete old group org assignments for group %s: %w", groupIDStr, err)
		}
		// Insert new assignments.
		for _, orgRN := range organizations {
			var on gen.OrganizationResourceName
			if err := on.UnmarshalString(orgRN); err != nil {
				continue
			}
			orgID, err := uuid.Parse(on.Organization)
			if err != nil {
				continue
			}
			assignment := &model.GroupOrganization{
				UserGroupID:    groupID,
				OrganizationID: orgID,
			}
			if err := r.db.WithContext(ctx).Create(assignment).Error; err != nil {
				return fmt.Errorf("create group org assignment group=%s org=%s: %w", groupIDStr, orgID, err)
			}
		}
	}

	// 2. Sync casbin g3 (derived from GORM).
	if _, err := r.enforcer.RemoveAllGroupOrgAssignments(groupIDStr); err != nil {
		return fmt.Errorf("remove old g3 assignments for group %s: %w", groupIDStr, err)
	}
	// Every group gets g3(group, "") for global access.
	if _, err := r.enforcer.AddGroupOrgAssignment(groupIDStr, authz.GlobalDomain); err != nil {
		return fmt.Errorf("add g3 global for group %s: %w", groupIDStr, err)
	}
	for _, orgRN := range organizations {
		var on gen.OrganizationResourceName
		if err := on.UnmarshalString(orgRN); err != nil {
			continue
		}
		if _, err := r.enforcer.AddGroupOrgAssignment(groupIDStr, authz.OrgDomain(on.Organization)); err != nil {
			return fmt.Errorf("add g3 group=%s org=%s: %w", groupIDStr, on.Organization, err)
		}
	}

	// 3. Sync casbin p policies.
	if permissions != nil {
		if _, err := r.enforcer.RemoveFilteredPolicy(0, groupIDStr); err != nil {
			return fmt.Errorf("remove old policies for group %s: %w", groupIDStr, err)
		}
		for _, permStr := range permissions {
			p, ok := authz.ParsePermission(permStr)
			if !ok {
				continue
			}
			if _, err := r.enforcer.AddPolicy(groupIDStr, p.Resource, p.Action); err != nil {
				return fmt.Errorf("add policy group=%s obj=%s act=%s: %w", groupIDStr, p.Resource, p.Action, err)
			}
		}
	}

	// 4. Flush to ensure all consumers see updated policies.
	return r.enforcer.Flush()
}

// GetOrganizations reads the group-to-organization assignments from the GORM
// table and returns them as organization resource names.
func (r *UserGroupRepository) GetOrganizations(ctx context.Context, groupID uuid.UUID) ([]string, error) {
	var assignments []model.GroupOrganization
	if err := r.db.WithContext(ctx).
		Preload("Organization").
		Where("user_group_id = ?", groupID).
		Find(&assignments).Error; err != nil {
		return nil, fmt.Errorf("get organizations for group %s: %w", groupID, err)
	}
	var result []string
	for _, a := range assignments {
		result = append(result, gen.OrganizationResourceName{Organization: a.Organization.CustomID}.String())
	}
	return result, nil
}

// GetPermissions reads the casbin policies for a group and returns them
// as "resource:action" strings.
func (r *UserGroupRepository) GetPermissions(groupID string) ([]string, error) {
	perms, err := r.enforcer.GetPermissionsForUser(groupID)
	if err != nil {
		return nil, fmt.Errorf("get permissions for group %s: %w", groupID, err)
	}
	var result []string
	for _, p := range perms {
		// p = [groupID, resource, action]
		if len(p) < 3 {
			continue
		}
		result = append(result, p[1]+":"+p[2])
	}
	return result, nil
}
