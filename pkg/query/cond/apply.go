// Package cond provides GORM integration for applying abstract condition chains.
//
// This file keeps the GORM dependency isolated from the core cond types.
package cond

import (
	"fmt"
	"strings"

	"gorm.io/gorm"
)

// ColumnMapper translates filter field names to database column names.
// Returns the column name and true if the field is known.
type ColumnMapper func(field string) (column string, ok bool)

// Apply applies a condition chain to a GORM query using the provided column mapper.
// Nil or empty conditions are ignored. Returns the modified query.
func Apply(db *gorm.DB, c Cond, mapper ColumnMapper) *gorm.DB {
	if c == nil || c.IsEmpty() {
		return db
	}
	sql, args := toSQL(c, mapper)
	if sql != "" {
		return db.Where(sql, args...)
	}
	return db
}

// toSQL converts a condition to SQL WHERE clause and arguments.
func toSQL(c Cond, mapper ColumnMapper) (string, []interface{}) {
	switch cond := c.(type) {
	case FieldCond:
		return fieldToSQL(cond, mapper)
	case AndCond:
		return andToSQL(cond, mapper)
	case OrCond:
		return orToSQL(cond, mapper)
	case NotCond:
		return notToSQL(cond, mapper)
	default:
		return "", nil
	}
}

// fieldToSQL converts a field condition to SQL.
func fieldToSQL(c FieldCond, mapper ColumnMapper) (string, []interface{}) {
	if c.IsEmpty() {
		return "", nil
	}

	column, ok := mapper(c.Field)
	if !ok {
		// Unknown field - skip this condition
		return "", nil
	}

	switch c.Op {
	case OpEq:
		return column + " = ?", []interface{}{c.Value}
	case OpNe:
		return column + " <> ?", []interface{}{c.Value}
	case OpLt:
		return column + " < ?", []interface{}{c.Value}
	case OpLte:
		return column + " <= ?", []interface{}{c.Value}
	case OpGt:
		return column + " > ?", []interface{}{c.Value}
	case OpGte:
		return column + " >= ?", []interface{}{c.Value}
	case OpHas:
		if s, ok := c.Value.(string); ok {
			return "LOWER(" + column + ") LIKE ?", []interface{}{"%" + strings.ToLower(s) + "%"}
		}
		return column + " LIKE ?", []interface{}{"%" + fmt.Sprint(c.Value) + "%"}
	default:
		return "", nil
	}
}

// andToSQL converts AND conditions to SQL.
func andToSQL(c AndCond, mapper ColumnMapper) (string, []interface{}) {
	conds := c.nonEmpty()
	if len(conds) == 0 {
		return "", nil
	}
	if len(conds) == 1 {
		return toSQL(conds[0], mapper)
	}

	var parts []string
	var args []interface{}
	for _, inner := range conds {
		sql, a := toSQL(inner, mapper)
		if sql != "" {
			parts = append(parts, "("+sql+")")
			args = append(args, a...)
		}
	}
	if len(parts) == 0 {
		return "", nil
	}
	return strings.Join(parts, " AND "), args
}

// orToSQL converts OR conditions to SQL.
func orToSQL(c OrCond, mapper ColumnMapper) (string, []interface{}) {
	conds := c.nonEmpty()
	if len(conds) == 0 {
		return "", nil
	}
	if len(conds) == 1 {
		return toSQL(conds[0], mapper)
	}

	var parts []string
	var args []interface{}
	for _, inner := range conds {
		sql, a := toSQL(inner, mapper)
		if sql != "" {
			parts = append(parts, "("+sql+")")
			args = append(args, a...)
		}
	}
	if len(parts) == 0 {
		return "", nil
	}
	return strings.Join(parts, " OR "), args
}

// notToSQL converts NOT condition to SQL.
func notToSQL(c NotCond, mapper ColumnMapper) (string, []interface{}) {
	if c.Inner == nil || c.Inner.IsEmpty() {
		return "", nil
	}

	// For FieldCond, invert the operator directly
	if fc, ok := c.Inner.(FieldCond); ok {
		return fieldToSQLNot(fc, mapper)
	}

	// For complex conditions, wrap in NOT
	sql, args := toSQL(c.Inner, mapper)
	if sql == "" {
		return "", nil
	}
	return "NOT (" + sql + ")", args
}

// fieldToSQLNot converts a negated field condition to SQL.
func fieldToSQLNot(c FieldCond, mapper ColumnMapper) (string, []interface{}) {
	if c.IsEmpty() {
		return "", nil
	}

	column, ok := mapper(c.Field)
	if !ok {
		return "", nil
	}

	switch c.Op {
	case OpEq:
		return column + " <> ?", []interface{}{c.Value}
	case OpNe:
		return column + " = ?", []interface{}{c.Value}
	case OpLt:
		return column + " >= ?", []interface{}{c.Value}
	case OpLte:
		return column + " > ?", []interface{}{c.Value}
	case OpGt:
		return column + " <= ?", []interface{}{c.Value}
	case OpGte:
		return column + " < ?", []interface{}{c.Value}
	case OpHas:
		if s, ok := c.Value.(string); ok {
			return "LOWER(" + column + ") NOT LIKE ?", []interface{}{"%" + strings.ToLower(s) + "%"}
		}
		return column + " NOT LIKE ?", []interface{}{"%" + fmt.Sprint(c.Value) + "%"}
	default:
		return "", nil
	}
}
