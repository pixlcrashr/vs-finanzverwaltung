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
	// ForceSystem bypasses the IsSystem guard, allowing updates to system groups.
	ForceSystem bool
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

	// Batch-load organization assignments from casbin g3 for all groups.
	if err := r.loadOrganizations(ctx, ms); err != nil {
		return nil, 0, fmt.Errorf("list user groups load organizations: %w", err)
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
	if err := r.loadOrganizations(ctx, []*model.UserGroup{m}); err != nil {
		return nil, fmt.Errorf("get user group load organizations id=%s: %w", id, err)
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
	if err := r.loadOrganizations(ctx, []*model.UserGroup{m}); err != nil {
		return nil, fmt.Errorf("get user group load organizations custom_id=%s: %w", customID, err)
	}
	return m, nil
}

// GetByResourceName resolves a group by its resource name identifier (the
// {group} segment of "groups/{group}"). The identifier may be either a UUID
// or a custom ID. It tries UUID first, then falls back to custom ID.
func (r *UserGroupRepository) GetByResourceName(ctx context.Context, identifier string) (*model.UserGroup, error) {
	// Try as UUID first.
	if id, err := uuid.Parse(identifier); err == nil {
		m, err := r.q.UserGroup.WithContext(ctx).Where(r.q.UserGroup.ID.Eq(id)).First()
		if err == nil {
			if err := r.loadOrganizations(ctx, []*model.UserGroup{m}); err != nil {
				return nil, fmt.Errorf("get user group load organizations id=%s: %w", identifier, err)
			}
			return m, nil
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("get user group id=%s: %w", identifier, err)
		}
		// Fall through to custom ID lookup.
	}

	// Fall back to custom ID.
	m, err := r.q.UserGroup.WithContext(ctx).Where(r.q.UserGroup.CustomID.Eq(identifier)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserGroupNotFound, fmt.Errorf("identifier=%s: %w", identifier, err))
		}
		return nil, fmt.Errorf("get user group identifier=%s: %w", identifier, err)
	}
	if err := r.loadOrganizations(ctx, []*model.UserGroup{m}); err != nil {
		return nil, fmt.Errorf("get user group load organizations identifier=%s: %w", identifier, err)
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

	if m.IsSystem && !params.ForceSystem {
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
// (casbin g3) and all casbin policies (p) for the given group. It then flushes
// the enforcer.
//
// Casbin g3 is the sole source of truth for group-to-organization assignments.
// Each entry is either "organizations/{customID}" for a specific org or "*" for
// wildcard org access. Casbin p policies are self-standing (no domain).
func (r *UserGroupRepository) syncAssignmentsAndPolicies(ctx context.Context, groupID uuid.UUID, organizations, permissions []string) error {
	groupIDStr := groupID.String()
	orgRepo := NewOrganizationRepository(r.db)

	// 1. Sync casbin g3 (sole source of truth for org assignments).
	if organizations != nil {
		if _, err := r.enforcer.RemoveAllGroupOrgAssignments(groupIDStr); err != nil {
			return fmt.Errorf("remove old g3 assignments for group %s: %w", groupIDStr, err)
		}

		// Every group gets g3(group, "g") for global domain access.
		if _, err := r.enforcer.AddGroupOrgAssignment(groupIDStr, authz.GlobalDomain); err != nil {
			return fmt.Errorf("add g3 global for group %s: %w", groupIDStr, err)
		}

		for _, orgRN := range organizations {
			// Wildcard: assign to all organizations (covers global domain too).
			if orgRN == authz.WildcardDomain {
				if _, err := r.enforcer.AddGroupOrgAssignment(groupIDStr, authz.WildcardDomain); err != nil {
					return fmt.Errorf("add g3 wildcard for group %s: %w", groupIDStr, err)
				}
				continue
			}

			var on gen.OrganizationResourceName
			if err := on.UnmarshalString(orgRN); err != nil {
				continue
			}

			// Resolve the org identifier (UUID or custom ID) to the org's custom ID.
			org, err := orgRepo.GetByResourceName(ctx, on.Organization)
			if err != nil {
				return fmt.Errorf("resolve organization %s for group %s: %w", on.Organization, groupIDStr, err)
			}
			if _, err := r.enforcer.AddGroupOrgAssignment(groupIDStr, authz.OrgDomain(org.CustomID)); err != nil {
				return fmt.Errorf("add g3 group=%s org=%s: %w", groupIDStr, org.CustomID, err)
			}
		}
	}

	// 2. Sync casbin p policies.
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

	// 3. Flush to ensure all consumers see updated policies.
	return r.enforcer.Flush()
}

// loadOrganizations populates the transient Organizations field on each group
// by reading casbin g3 entries. It loads all g3 assignments in a single call
// and distributes them to the matching groups. A wildcard ("*") assignment is
// expanded to all existing organization resource names.
func (r *UserGroupRepository) loadOrganizations(ctx context.Context, groups []*model.UserGroup) error {
	if len(groups) == 0 {
		return nil
	}

	allAssignments, err := r.enforcer.GetAllGroupOrgAssignments()
	if err != nil {
		return fmt.Errorf("load all g3 assignments: %w", err)
	}

	// Eagerly load all organizations once, in case any group has a wildcard.
	var allOrgResourceNames []string
	needsAllOrgs := false
	for _, g := range groups {
		if hasWildcard(allAssignments[g.ID.String()]) {
			needsAllOrgs = true
			break
		}
	}
	if needsAllOrgs {
		allOrgResourceNames, err = r.allOrganizationResourceNames(ctx)
		if err != nil {
			return fmt.Errorf("load all organizations for wildcard expansion: %w", err)
		}
	}

	for _, g := range groups {
		domains := allAssignments[g.ID.String()]
		g.Organizations = domainsToResourceNames(domains, allOrgResourceNames)
	}

	return nil
}

// hasWildcard reports whether the domain list contains the wildcard entry.
func hasWildcard(domains []string) bool {
	for _, d := range domains {
		if d == authz.WildcardDomain {
			return true
		}
	}
	return false
}

// allOrganizationResourceNames returns the resource names of all organizations
// in the database, ordered by creation date (descending).
func (r *UserGroupRepository) allOrganizationResourceNames(ctx context.Context) ([]string, error) {
	orgRepo := NewOrganizationRepository(r.db)
	orgs, _, err := orgRepo.List(ctx, ListOrganizationsParams{PageSize: 10000})
	if err != nil {
		return nil, fmt.Errorf("list all organizations: %w", err)
	}
	result := make([]string, 0, len(orgs))
	for _, o := range orgs {
		result = append(result, authz.OrgDomain(o.CustomID))
	}
	return result, nil
}

// domainsToResourceNames converts casbin g3 domain values to organization
// resource names. A wildcard ("*") domain is expanded to allOrgResourceNames
// (when non-empty); "organizations/{customID}" values are kept as-is. The
// global domain ("g") is excluded — it is not an organization.
func domainsToResourceNames(domains, allOrgResourceNames []string) []string {
	if len(domains) == 0 {
		return nil
	}
	result := make([]string, 0, len(domains))
	for _, d := range domains {
		// Skip the global domain — it grants access to global resources, not
		// to a specific organization.
		if d == authz.GlobalDomain {
			continue
		}
		if d == authz.WildcardDomain {
			if len(allOrgResourceNames) > 0 {
				result = append(result, allOrgResourceNames...)
			} else {
				result = append(result, authz.WildcardDomain)
			}
			continue
		}
		// d is already in "organizations/{customID}" format.
		result = append(result, d)
	}
	return result
}

// GetOrganizations reads the group-to-organization assignments from casbin g3
// and returns them as organization resource names. A wildcard ("*") assignment
// is expanded to all existing organization resource names.
func (r *UserGroupRepository) GetOrganizations(ctx context.Context, groupID uuid.UUID) ([]string, error) {
	domains, err := r.enforcer.GetOrganizationsForGroup(groupID.String())
	if err != nil {
		return nil, fmt.Errorf("get organizations for group %s: %w", groupID, err)
	}

	var allOrgResourceNames []string
	if hasWildcard(domains) {
		allOrgResourceNames, err = r.allOrganizationResourceNames(ctx)
		if err != nil {
			return nil, fmt.Errorf("load all organizations for wildcard expansion: %w", err)
		}
	}

	return domainsToResourceNames(domains, allOrgResourceNames), nil
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
