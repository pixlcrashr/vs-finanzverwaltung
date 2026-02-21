package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
)

// Setting uses a string primary key (not auto-generated UUID).
type Setting struct {
	ID           string          `gorm:"primaryKey;not null"`
	Type         string          `gorm:"type:varchar(16);not null;index:idx_settings_type"`
	ValueFloat   *float64        `gorm:"default:null"`
	ValueInt     *int64          `gorm:"type:bigint;default:null"`
	ValueText    *string         `gorm:"default:null"`
	ValueBool    *bool           `gorm:"default:null"`
	ValueDecimal apd.NullDecimal `gorm:"type:decimal;default:null"`
	ValueUUID    uuid.NullUUID   `gorm:"type:uuid;default:null"`
	CreatedAt    time.Time       `gorm:"not null;default:now()"`
	UpdatedAt    time.Time       `gorm:"not null;default:now()"`
}

func (Setting) TableName() string { return "settings" }
