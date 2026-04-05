package types

import (
	"encoding/json"
	"reflect"

	"github.com/danielgtaylor/huma/v2"
)

// Optional represents a JSON field that distinguishes between three states:
//
//   - absent  (IsSet=false)            → field was not included in JSON
//   - null    (IsSet=true, Value=zero) → field was explicitly set to null
//   - value   (IsSet=true, Value=v)    → field was set to a concrete value
//
// This enables PATCH semantics where absent means "don't touch",
// null means "clear/reset", and a value means "update".
//
// Fields using Optional[T] MUST include "omitempty" in their JSON struct tag
// so that Huma marks them as not-required in the OpenAPI schema. Without it,
// Huma rejects requests that omit the field before UnmarshalJSON is ever called.
// Note: omitempty has no effect on marshaling for struct types in Go, so this is
// purely a signal for schema generation.
type Optional[T any] struct {
	Value T
	IsSet bool
}

// Schema implements huma.SchemaProvider. It returns the schema of the wrapped
// type T so that the Optional wrapper is invisible in the OpenAPI spec.
func (o Optional[T]) Schema(r huma.Registry) *huma.Schema {
	return huma.SchemaFromType(r, reflect.TypeOf(o.Value))
}

// Receiver returns a reflect.Value pointing to the wrapped Value field.
// Used by Huma for query/path/header parameter parsing.
func (o *Optional[T]) Receiver() reflect.Value {
	return reflect.ValueOf(o).Elem().Field(0)
}

// OnParamSet is called by Huma after a query/path/header param has been parsed.
func (o *Optional[T]) OnParamSet(isSet bool, parsed any) {
	o.IsSet = isSet
}

// MarshalJSON implements json.Marshaler.
// Outputs the raw value of T when set, or null when not set.
func (o Optional[T]) MarshalJSON() ([]byte, error) {
	if !o.IsSet {
		return []byte("null"), nil
	}
	return json.Marshal(o.Value)
}

// UnmarshalJSON implements json.Unmarshaler.
// This method is ONLY called by encoding/json when the field IS present in the
// JSON body. If the field is absent, this is never called and IsSet stays false.
// MUST have pointer receiver so that mutations are retained.
func (o *Optional[T]) UnmarshalJSON(data []byte) error {
	o.IsSet = true
	if string(data) == "null" {
		return nil
	}
	return json.Unmarshal(data, &o.Value)
}
