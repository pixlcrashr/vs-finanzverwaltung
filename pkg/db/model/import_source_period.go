package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImportSourcePeriod struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey"`
	ImportSourceID uuid.UUID  `gorm:"type:uuid;not null;uniqueIndex:idx_import_source_periods_source_year"`
	Year           int        `gorm:"not null;default:0;uniqueIndex:idx_import_source_periods_source_year"`
	IsClosed       bool       `gorm:"not null;default:false"`
	UpdatedAt      time.Time  `gorm:"not null;default:now()"`
	CreatedAt      time.Time  `gorm:"not null;default:now()"`

	// Relations
	ImportSource *ImportSource `gorm:"foreignKey:ImportSourceID"`
}

func (ImportSourcePeriod) TableName() string { return "import_source_periods" }

func (m *ImportSourcePeriod) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ImportSourcePeriod) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
