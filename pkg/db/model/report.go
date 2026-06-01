package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Report struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_reports_org_id,priority:1"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_reports_org_id,priority:2"`
	DisplayName    string    `gorm:"not null;default:''"`
	Data           []byte    `gorm:"type:bytea;not null"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
}

func (Report) TableName() string { return "reports" }

func (m *Report) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Report) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
