package repository

import (
	"strings"
	"unicode"

	"github.com/pixlcrashr/go-pagetoken/order"
	"gorm.io/gen/field"
)

// FieldResolver can look up a generated DAO field by its snake_case column name.
// Every generated DAO type (e.g. dao.account, dao.budget) implements this.
type FieldResolver interface {
	GetFieldByName(fieldName string) (field.OrderExpr, bool)
}

// ResolveOrderBy converts parsed order.Fields into GORM OrderExpr values using the
// provided FieldResolver. Field paths are expected in camelCase (API convention) and
// are converted to snake_case for DAO lookup. Returns nil when fields is empty,
// letting the caller fall through to a default sort.
func ResolveOrderBy(resolver FieldResolver, fields order.Fields) []field.Expr {
	if len(fields) == 0 {
		return nil
	}

	var exprs []field.Expr
	for _, f := range fields {
		colName := camelToSnake(f.Path)
		oe, ok := resolver.GetFieldByName(colName)
		if !ok {
			continue
		}
		if f.Order == order.Desc {
			exprs = append(exprs, oe.Desc())
		} else {
			exprs = append(exprs, oe.Asc())
		}
	}

	if len(exprs) == 0 {
		return nil
	}
	return exprs
}

// camelToSnake converts a camelCase or PascalCase string to snake_case.
func camelToSnake(s string) string {
	var b strings.Builder
	for i, r := range s {
		if unicode.IsUpper(r) {
			if i > 0 {
				b.WriteByte('_')
			}
			b.WriteRune(unicode.ToLower(r))
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}
