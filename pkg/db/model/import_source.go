package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImportSource struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey"`
	OrganizationID     uuid.UUID `gorm:"type:uuid;not null;index:idx_import_sources_organization_id"`
	DisplayName        string    `gorm:"not null;default:''"`
	DisplayDescription string    `gorm:"not null;default:''"`
	PeriodStart        time.Time `gorm:"type:date;not null;default:now()"`
	UpdatedAt          time.Time `gorm:"not null;default:now()"`
	CreatedAt          time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization        Organization         `gorm:"foreignKey:OrganizationID"`
	TransactionAccounts []TransactionAccount `gorm:"foreignKey:ImportSourceID"`
	ImportSourcePeriods []ImportSourcePeriod `gorm:"foreignKey:ImportSourceID"`
}

func (ImportSource) TableName() string { return "import_sources" }

func (m *ImportSource) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ImportSource) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
