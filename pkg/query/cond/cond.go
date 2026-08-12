// Package cond provides an abstract, library-independent condition chain for database filtering.
//
// This package defines a generic filter representation that supports:
//   - Field conditions (field OP value) where OP is an integer constant
//   - AND / OR combinators (nested arbitrarily)
//   - NOT negation
//
// The condition chain is database-agnostic and can be applied to any query builder
// via a FieldMapper that translates filter field names to database expressions.
//
// Example usage:
//
//	// Build condition chain (typically done by filter parser in service layer)
//	c := cond.And(
//	    cond.Eq("display_name", "foo"),
//	    cond.Or(
//	        cond.Gte("year", 2020),
//	        cond.Eq("is_active", true),
//	    ),
//	)
//
//	// Use in repository (field names mapped to DB columns)
//	params := ListAccountsParams{Cond: c}
//	accounts, total, err := repo.List(ctx, params)
package cond

// Op represents a comparison operator as an integer constant.
type Op int

const (
	OpEq  Op = iota + 1 // 1: Equal (=)
	OpNe                // 2: Not equal (!=)
	OpLt                // 3: Less than (<)
	OpLte               // 4: Less than or equal (<=)
	OpGt                // 5: Greater than (>)
	OpGte               // 6: Greater than or equal (>=)
	OpHas               // 7: Has/contains (substring match)
)

// Cond is the interface for all condition types.
// This is the abstract representation used throughout the pipeline.
type Cond interface {
	// IsEmpty returns true if this condition is a no-op (should be ignored).
	IsEmpty() bool
}

// FieldCond is a leaf condition comparing a field to a value.
// Field names are the filter-level names (e.g., "display_name"), not DB columns.
type FieldCond struct {
	Field string      // Filter field name
	Op    Op          // Integer operator (OpEq, OpNe, etc.)
	Value interface{} // Value to compare (type determined by context)
}

var _ Cond = FieldCond{}

func (f FieldCond) IsEmpty() bool {
	return f.Field == ""
}

// AndCond combines multiple conditions with AND logic.
type AndCond struct {
	Conds []Cond
}

var _ Cond = AndCond{}

func (a AndCond) IsEmpty() bool {
	return len(a.nonEmpty()) == 0
}

func (a AndCond) nonEmpty() []Cond {
	var result []Cond
	for _, c := range a.Conds {
		if c != nil && !c.IsEmpty() {
			result = append(result, c)
		}
	}
	return result
}

// OrCond combines multiple conditions with OR logic.
type OrCond struct {
	Conds []Cond
}

var _ Cond = OrCond{}

func (o OrCond) IsEmpty() bool {
	return len(o.nonEmpty()) == 0
}

func (o OrCond) nonEmpty() []Cond {
	var result []Cond
	for _, c := range o.Conds {
		if c != nil && !c.IsEmpty() {
			result = append(result, c)
		}
	}
	return result
}

// NotCond negates an inner condition.
type NotCond struct {
	Inner Cond
}

var _ Cond = NotCond{}

func (n NotCond) IsEmpty() bool {
	return n.Inner == nil || n.Inner.IsEmpty()
}

// ── Constructor Functions ───────────────────────────────────────────────────

// Eq creates an equality condition: field = value
func Eq(field string, value interface{}) Cond {
	return FieldCond{Field: field, Op: OpEq, Value: value}
}

// Ne creates a not-equal condition: field != value
func Ne(field string, value interface{}) Cond {
	return FieldCond{Field: field, Op: OpNe, Value: value}
}

// Lt creates a less-than condition: field < value
func Lt(field string, value interface{}) Cond {
	return FieldCond{Field: field, Op: OpLt, Value: value}
}

// Lte creates a less-than-or-equal condition: field <= value
func Lte(field string, value interface{}) Cond {
	return FieldCond{Field: field, Op: OpLte, Value: value}
}

// Gt creates a greater-than condition: field > value
func Gt(field string, value interface{}) Cond {
	return FieldCond{Field: field, Op: OpGt, Value: value}
}

// Gte creates a greater-than-or-equal condition: field >= value
func Gte(field string, value interface{}) Cond {
	return FieldCond{Field: field, Op: OpGte, Value: value}
}

// Has creates a substring condition: field CONTAINS value
func Has(field string, value string) Cond {
	return FieldCond{Field: field, Op: OpHas, Value: value}
}

// And combines conditions with AND logic.
// Empty conditions are filtered out. Single condition returns as-is.
func And(conds ...Cond) Cond {
	a := AndCond{Conds: conds}
	if len(a.nonEmpty()) == 1 {
		return a.nonEmpty()[0]
	}
	return a
}

// Or combines conditions with OR logic.
// Empty conditions are filtered out. Single condition returns as-is.
func Or(conds ...Cond) Cond {
	o := OrCond{Conds: conds}
	if len(o.nonEmpty()) == 1 {
		return o.nonEmpty()[0]
	}
	return o
}

// Not negates a condition.
func Not(c Cond) Cond {
	return NotCond{Inner: c}
}

// Transform walks a condition tree and applies fn to each FieldCond.
// If fn returns ok=false, the FieldCond is dropped (treated as no-op).
// Returns a new cond tree with transformed fields; the input cond is not mutated.
// Nil or empty conditions are returned as-is.
func Transform(c Cond, fn func(field string, value interface{}) (newField string, newValue interface{}, ok bool)) Cond {
	if c == nil || c.IsEmpty() {
		return c
	}
	switch cc := c.(type) {
	case FieldCond:
		newField, newValue, ok := fn(cc.Field, cc.Value)
		if !ok {
			return FieldCond{} // empty, will be filtered out
		}
		return FieldCond{Field: newField, Op: cc.Op, Value: newValue}
	case AndCond:
		var transformed []Cond
		for _, inner := range cc.Conds {
			t := Transform(inner, fn)
			if t != nil && !t.IsEmpty() {
				transformed = append(transformed, t)
			}
		}
		if len(transformed) == 0 {
			return AndCond{}
		}
		if len(transformed) == 1 {
			return transformed[0]
		}
		return AndCond{Conds: transformed}
	case OrCond:
		var transformed []Cond
		for _, inner := range cc.Conds {
			t := Transform(inner, fn)
			if t != nil && !t.IsEmpty() {
				transformed = append(transformed, t)
			}
		}
		if len(transformed) == 0 {
			return OrCond{}
		}
		if len(transformed) == 1 {
			return transformed[0]
		}
		return OrCond{Conds: transformed}
	case NotCond:
		inner := Transform(cc.Inner, fn)
		if inner == nil || inner.IsEmpty() {
			return NotCond{}
		}
		return NotCond{Inner: inner}
	}
	return c
}
