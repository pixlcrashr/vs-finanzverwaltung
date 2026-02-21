package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReportTemplate struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	DisplayName string    `gorm:"not null;default:''"`
	Template    string    `gorm:"not null;default:''"`
	UpdatedAt   time.Time `gorm:"not null;default:now()"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
}

func (ReportTemplate) TableName() string { return "report_templates" }

func (m *ReportTemplate) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ReportTemplate) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
