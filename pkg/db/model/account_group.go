package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountGroup struct {
	ID                          uuid.UUID `gorm:"type:uuid;primaryKey"`
	DisplayName                 string    `gorm:"not null;default:''"`
	DisplayDescription          string    `gorm:"not null;default:''"`
	UpdatedAt                   time.Time `gorm:"not null;default:now()"`
	CreatedAt                   time.Time `gorm:"not null;default:now()"`

	// Relations
	AccountGroupAssignments      []AccountGroupAssignment      `gorm:"foreignKey:AccountGroupID"`
	ViewAccountGroupAssignments  []ViewAccountGroupAssignment  `gorm:"foreignKey:AccountGroupID"`
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
