package types

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/lib/pq"
	"github.com/pixlcrashr/vsfv/pkg/db/dialect"
)

// StringArray is a cross-database compatible []string type.
//
// On PostgreSQL it serializes using the native pq.StringArray format ({a,b,c})
// so the column can remain a text[] array. On SQLite it serializes as JSON
// (["a","b","c"]) since SQLite has no native array type.
//
// Scan handles both formats transparently.
type StringArray []string

// Value implements driver.Valuer.
func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	if dialect.Current == dialect.SQLite {
		return json.Marshal([]string(a))
	}
	return pq.StringArray(a).Value()
}

// Scan implements sql.Scanner.
func (a *StringArray) Scan(src interface{}) error {
	if src == nil {
		*a = nil
		return nil
	}

	switch v := src.(type) {
	case []byte:
		s := string(v)
		return a.scanString(s)
	case string:
		return a.scanString(v)
	default:
		pqArr := pq.StringArray(*a)
		return pqArr.Scan(src)
	}
}

// scanString tries JSON first, then falls back to PostgreSQL array format.
func (a *StringArray) scanString(s string) error {
	// Try JSON format first (SQLite stores JSON)
	if strings.HasPrefix(s, "[") {
		var arr []string
		if err := json.Unmarshal([]byte(s), &arr); err == nil {
			*a = StringArray(arr)
			return nil
		}
	}

	// Fall back to PostgreSQL array format ({a,b,c})
	pqArr := pq.StringArray{}
	if err := pqArr.Scan(s); err != nil {
		return fmt.Errorf("StringArray.Scan: cannot parse %q: %w", s, err)
	}
	*a = StringArray(pqArr)
	return nil
}
