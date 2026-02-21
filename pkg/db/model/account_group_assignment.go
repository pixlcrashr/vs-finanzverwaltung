package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountGroupAssignment struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	AccountGroupID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_account_group_id_account_id"`
	AccountID      uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_account_group_id_account_id"`
	Negate         bool      `gorm:"not null;default:false;index:idx_account_group_assignments_negate"`
	UpdatedAt      time.Time `gorm:"not null;default:now()"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	AccountGroup AccountGroup `gorm:"foreignKey:AccountGroupID"`
	Account      Account      `gorm:"foreignKey:AccountID"`
}

func (AccountGroupAssignment) TableName() string { return "account_group_assignments" }

func (m *AccountGroupAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *AccountGroupAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
