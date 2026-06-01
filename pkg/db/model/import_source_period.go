package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImportSourcePeriod struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_import_source_periods_org_id,priority:1"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_import_source_periods_org_id,priority:2;uniqueIndex:idx_import_source_periods_org_source,priority:1"`
	ImportSourceID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_import_source_periods_org_source,priority:2"`
	Year           int       `gorm:"not null;default:0;uniqueIndex:idx_import_source_periods_source_year"`
	IsClosed       bool      `gorm:"not null;default:false"`
	UpdatedAt      time.Time `gorm:"not null;default:now()"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization Organization  `gorm:"foreignKey:OrganizationID"`
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
