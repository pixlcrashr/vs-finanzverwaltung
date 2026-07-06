package authz

import (
	"context"
	"errors"
	"fmt"
)

var (
	ErrUnauthenticated = errors.New("unauthenticated: no user ID in context")
	ErrScopeDenied     = errors.New("permission denied: insufficient scope")
	ErrPermissionDenied = errors.New("permission denied: casbin check failed")
)

// Check verifies that the authenticated user has both the required OAuth2 scope
// and the casbin permission for the given resource/action within an organization domain.
//
// Parameters:
//   - ctx: must contain user ID and scopes (set by auth middleware)
//   - enforcer: casbin enforcer
//   - resource: casbin resource (e.g. authz.ResourceAccounts)
//   - action: casbin action (e.g. authz.ActionRead, authz.ActionCreate)
//   - orgDomain: organization custom ID for org-scoped resources, or GlobalDomain for global resources
//
// Returns nil if authorized, an error otherwise.
func Check(ctx context.Context, enforcer *Enforcer, resource, action, orgDomain string) error {
	userID, ok := UserIDFromContext(ctx)
	if !ok {
		return ErrUnauthenticated
	}

	// 1. Check OAuth2 scope
	requiredScope := ActionToScope(resource, action)
	scopes, _ := ScopesFromContext(ctx)
	if !HasScope(scopes, requiredScope) {
		return fmt.Errorf("%w: required %s", ErrScopeDenied, requiredScope)
	}

	// 2. Check casbin permission
	dom := orgDomain
	if GlobalResources[resource] {
		dom = GlobalDomain
	}

	allowed, err := enforcer.Enforce(userID, dom, resource, action)
	if err != nil {
		return fmt.Errorf("casbin enforce: %w", err)
	}
	if !allowed {
		return fmt.Errorf("%w: %s/%s on %s", ErrPermissionDenied, resource, action, dom)
	}

	return nil
}
