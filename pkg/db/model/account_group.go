package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountGroup struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey"`
	OrganizationID     uuid.UUID `gorm:"type:uuid;not null;index:idx_account_groups_organization_id"`
	DisplayName        string    `gorm:"not null;default:''"`
	DisplayDescription string    `gorm:"not null;default:''"`
	UpdatedAt          time.Time `gorm:"not null;default:now()"`
	CreatedAt          time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization            Organization             `gorm:"foreignKey:OrganizationID"`
	AccountGroupAssignments []AccountGroupAssignment `gorm:"foreignKey:AccountGroupID"`
}

func (AccountGroup) TableName() string { return "account_groups" }

func (m *AccountGroup) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *AccountGroup) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
