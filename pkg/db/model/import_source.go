package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImportSource struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_import_sources_org_id,priority:1"`
	CustomID           string    `gorm:"uniqueIndex:idx_import_sources_custom_id_org,priority:1"`
	OrganizationID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_import_sources_org_id,priority:2;uniqueIndex:idx_import_sources_custom_id_org,priority:2"`
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

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *ImportSource) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
