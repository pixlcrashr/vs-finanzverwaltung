// Package order provides conversion from AIP ordering to SQL ORDER BY clauses.
//
// This package works with go.einride.tech/aip/ordering.OrderBy to convert
// API-style field paths (e.g., "displayName desc", "createTime") into
// SQL ORDER BY expressions.
//
// Example usage:
//
//	// Parse ordering from AIP request
//	orderBy, err := ordering.ParseOrderBy(req)
//	if err != nil {
//	    return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
//	}
//
//	// Convert to SQL using field mapper
//	exprs, err := order.Resolve(orderBy, order.FieldMapper{
//	    "displayName": "display_name",
//	    "createTime":  "created_at",
//	})
//	if err != nil {
//	    return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
//	}
//
//	// Apply to GORM query
//	for _, expr := range exprs {
//	    db = db.Order(expr)
//	}
//
package order

import (
	"fmt"
	"strings"

	"go.einride.tech/aip/ordering"
)

// FieldMapper translates API field names (camelCase) to database column names (snake_case).
type FieldMapper map[string]string

// Lookup returns the database column name for the given API field path.
// Returns empty string if the field is not found.
func (m FieldMapper) Lookup(path string) (string, bool) {
	// Handle nested paths by converting each segment
	segments := strings.Split(path, ".")
	mapped := make([]string, len(segments))

	for i, seg := range segments {
		col, ok := m[seg]
		if !ok {
			// Try the original segment name
			col = seg
		}
		mapped[i] = col
	}

	return strings.Join(mapped, "."), true
}

// Expr represents a single SQL ORDER BY expression.
type Expr struct {
	Column string
	Desc   bool
}

// String returns the SQL ORDER BY expression.
func (e Expr) String() string {
	if e.Desc {
		return e.Column + " DESC"
	}
	return e.Column + " ASC"
}

// Resolve converts an ordering.OrderBy into SQL ORDER BY expressions.
// Returns an error if any field path cannot be mapped.
func Resolve(orderBy ordering.OrderBy, mapper FieldMapper) ([]Expr, error) {
	if len(orderBy.Fields) == 0 {
		return nil, nil
	}

	var exprs []Expr
	for _, f := range orderBy.Fields {
		col, ok := mapper.Lookup(f.Path)
		if !ok {
			return nil, fmt.Errorf("unknown order_by field: %s", f.Path)
		}
		exprs = append(exprs, Expr{Column: col, Desc: f.Desc})
	}

	return exprs, nil
}

// ResolveOrDefault converts an ordering.OrderBy into SQL ORDER BY expressions,
// returning a default expression if the order_by is empty or fields cannot be mapped.
func ResolveOrDefault(orderBy ordering.OrderBy, mapper FieldMapper, defaultExpr Expr) []Expr {
	exprs, err := Resolve(orderBy, mapper)
	if err != nil || len(exprs) == 0 {
		return []Expr{defaultExpr}
	}
	return exprs
}

// ResolveIgnoreUnknown converts an ordering.OrderBy into SQL ORDER BY expressions,
// ignoring unknown fields (they are skipped rather than causing an error).
func ResolveIgnoreUnknown(orderBy ordering.OrderBy, mapper FieldMapper) []Expr {
	if len(orderBy.Fields) == 0 {
		return nil
	}

	var exprs []Expr
	for _, f := range orderBy.Fields {
		col, ok := mapper.Lookup(f.Path)
		if !ok {
			continue // Skip unknown fields
		}
		exprs = append(exprs, Expr{Column: col, Desc: f.Desc})
	}

	return exprs
}
