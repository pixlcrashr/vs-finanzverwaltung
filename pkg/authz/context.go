package authz

import "context"

type ctxKey int

const (
	keyUserID ctxKey = iota
	keyScopes
)

// WithUser stores the authenticated user ID and granted scopes in the context.
func WithUser(ctx context.Context, userID string, scopes []string) context.Context {
	ctx = context.WithValue(ctx, keyUserID, userID)
	return context.WithValue(ctx, keyScopes, scopes)
}

// UserIDFromContext extracts the authenticated user ID from the context.
// Returns the ID and true if present, or "" and false if unauthenticated.
func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(keyUserID).(string)
	return v, ok
}

// ScopesFromContext extracts the granted OAuth2 scopes from the context.
func ScopesFromContext(ctx context.Context) ([]string, bool) {
	v, ok := ctx.Value(keyScopes).([]string)
	return v, ok
}
