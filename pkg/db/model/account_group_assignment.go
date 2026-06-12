package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AccountGroupAssignment struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_account_group_assignments_org_id,priority:1"`
	CustomID       string    `gorm:"uniqueIndex:idx_account_group_assignments_custom_id,priority:1"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_account_group_assignments_org_id,priority:3;uniqueIndex:idx_account_group_assignments_org_group_account,priority:1;uniqueIndex:idx_account_group_assignments_custom_id,priority:2"`
	AccountGroupID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_account_group_assignments_org_group_account,priority:2;uniqueIndex:idx_account_group_assignments_custom_id,priority:3"`
	AccountID      uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_account_group_assignments_org_group_account,priority:3"`
	Negate         bool      `gorm:"not null;default:false;index:idx_account_group_assignments_negate"`
	UpdatedAt      time.Time `gorm:"not null;default:now()"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
	AccountGroup AccountGroup `gorm:"foreignKey:AccountGroupID"`
	Account      Account      `gorm:"foreignKey:AccountID"`
}

func (AccountGroupAssignment) TableName() string { return "account_group_assignments" }

func (m *AccountGroupAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *AccountGroupAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
