package authz

import (
	"embed"
	"fmt"
	"sync"

	"github.com/casbin/casbin/v2"
	"github.com/casbin/casbin/v2/model"
	gormadapter "github.com/casbin/gorm-adapter/v3"
	"gorm.io/gorm"
)

//go:embed casbin_model.conf
var casbinModelFS embed.FS

// Enforcer wraps a casbin.SyncedEnforcer with convenience methods for
// the VSFV permission model. The underlying enforcer auto-saves to the
// database and exposes a Flush method to reload policies after external
// changes.
type Enforcer struct {
	e  *casbin.SyncedEnforcer
	mu sync.Mutex
}

// NewEnforcer creates a new Enforcer backed by the given gorm.DB.
// It uses the existing "casbin_rule" table via gorm-adapter.
func NewEnforcer(db *gorm.DB) (*Enforcer, error) {
	adapter, err := gormadapter.NewAdapterByDBWithCustomTable(db, nil, "casbin_rule")
	if err != nil {
		return nil, fmt.Errorf("authz: create adapter: %w", err)
	}

	modelBytes, err := casbinModelFS.ReadFile("casbin_model.conf")
	if err != nil {
		return nil, fmt.Errorf("authz: read model: %w", err)
	}

	m, err := model.NewModelFromString(string(modelBytes))
	if err != nil {
		return nil, fmt.Errorf("authz: parse model: %w", err)
	}

	e, err := casbin.NewSyncedEnforcer(m, adapter)
	if err != nil {
		return nil, fmt.Errorf("authz: create enforcer: %w", err)
	}

	e.EnableAutoSave(true)

	if err := e.LoadPolicy(); err != nil {
		return nil, fmt.Errorf("authz: load policy: %w", err)
	}

	return &Enforcer{e: e}, nil
}

// Flush reloads all policies from the database. Call this after any
// external policy mutation (e.g. group permission changes).
func (en *Enforcer) Flush() error {
	en.mu.Lock()
	defer en.mu.Unlock()
	return en.e.LoadPolicy()
}

// Enforce checks whether sub may perform act on obj within domain dom.
func (en *Enforcer) Enforce(sub, dom, obj, act string) (bool, error) {
	return en.e.Enforce(sub, dom, obj, act)
}

// AddPolicy adds a policy rule (p, sub, dom, obj, act).
func (en *Enforcer) AddPolicy(sub, dom, obj, act string) (bool, error) {
	return en.e.AddPolicy(sub, dom, obj, act)
}

// RemovePolicy removes a policy rule.
func (en *Enforcer) RemovePolicy(sub, dom, obj, act string) (bool, error) {
	return en.e.RemovePolicy(sub, dom, obj, act)
}

// RemoveFilteredPolicy removes all policy rules matching the given field values.
func (en *Enforcer) RemoveFilteredPolicy(fieldIndex int, fieldValues ...string) (bool, error) {
	return en.e.RemoveFilteredPolicy(fieldIndex, fieldValues...)
}

// AddGroupingPolicy adds a per-domain role assignment (g, user, role, domain).
func (en *Enforcer) AddGroupingPolicy(user, role, domain string) (bool, error) {
	return en.e.AddGroupingPolicy(user, role, domain)
}

// RemoveGroupingPolicy removes a per-domain role assignment.
func (en *Enforcer) RemoveGroupingPolicy(user, role, domain string) (bool, error) {
	return en.e.RemoveGroupingPolicy(user, role, domain)
}

// GetRolesForUserInDomain returns all role names assigned to user in the given domain.
func (en *Enforcer) GetRolesForUserInDomain(user, domain string) []string {
	return en.e.GetRolesForUserInDomain(user, domain)
}

// GetUsersForRoleInDomain returns all user IDs assigned to role in the given domain.
func (en *Enforcer) GetUsersForRoleInDomain(role, domain string) []string {
	return en.e.GetUsersForRoleInDomain(role, domain)
}

// ── Global (g2) role assignments ─────────────────────────────────────────────
// g2 is used for system-wide roles that are not scoped to an organization
// (e.g. user management, group management, settings).

// AddGlobalGroupingPolicy adds a global role assignment (g2, user, role).
func (en *Enforcer) AddGlobalGroupingPolicy(user, role string) (bool, error) {
	return en.e.AddNamedGroupingPolicy("g2", user, role)
}

// RemoveGlobalGroupingPolicy removes a global role assignment.
func (en *Enforcer) RemoveGlobalGroupingPolicy(user, role string) (bool, error) {
	return en.e.RemoveNamedGroupingPolicy("g2", user, role)
}

// GetGlobalRolesForUser returns all global (non-org) role names for a user.
func (en *Enforcer) GetGlobalRolesForUser(user string) ([]string, error) {
	policies, err := en.e.GetNamedGroupingPolicy("g2")
	if err != nil {
		return nil, err
	}
	var roles []string
	for _, p := range policies {
		if len(p) >= 2 && p[0] == user {
			roles = append(roles, p[1])
		}
	}
	return roles, nil
}

// GetPermissionsForUser returns all (sub, dom, obj, act) tuples for user/role.
func (en *Enforcer) GetPermissionsForUser(user string) ([][]string, error) {
	perms, err := en.e.GetPermissionsForUser(user)
	return perms, err
}
