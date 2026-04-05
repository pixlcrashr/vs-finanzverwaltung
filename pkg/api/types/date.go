package types

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/danielgtaylor/huma/v2"
)

const DateFormat = "2006-01-02"

// Date represents a date-only value (YYYY-MM-DD) for JSON serialization.
// It wraps time.Time but marshals/unmarshals as "YYYY-MM-DD" instead of RFC3339.
type Date struct {
	time.Time
}

// NewDate creates a Date from a time.Time, discarding the time component.
func NewDate(t time.Time) Date {
	y, m, d := t.Date()
	return Date{Time: time.Date(y, m, d, 0, 0, 0, 0, time.UTC)}
}

func (d Date) MarshalJSON() ([]byte, error) {
	return json.Marshal(d.Time.Format(DateFormat))
}

func (d *Date) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err != nil {
		return err
	}
	t, err := time.Parse(DateFormat, s)
	if err != nil {
		return fmt.Errorf("invalid date format %q, expected YYYY-MM-DD: %w", s, err)
	}
	d.Time = t
	return nil
}

// Schema implements huma.SchemaProvider to generate OpenAPI format:"date".
func (d Date) Schema(r huma.Registry) *huma.Schema {
	return &huma.Schema{
		Type:   huma.TypeString,
		Format: "date",
	}
}
