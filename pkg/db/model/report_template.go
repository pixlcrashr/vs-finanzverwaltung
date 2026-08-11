package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportTemplate struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_report_templates_org_id,priority:1"`
	CustomID       string    `gorm:"uniqueIndex:idx_report_templates_custom_id_org,priority:1"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_report_templates_org_id,priority:2;uniqueIndex:idx_report_templates_custom_id_org,priority:2"`
	DisplayName    string    `gorm:"not null;default:''"`
	Template       string    `gorm:"not null;default:''"`
	UpdatedAt      time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt      time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
}

func (ReportTemplate) TableName() string { return "report_templates" }

func (m *ReportTemplate) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *ReportTemplate) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
