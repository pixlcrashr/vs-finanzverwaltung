package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Account struct {
	ID                 uuid.UUID     `gorm:"type:uuid;primaryKey"`
	OrganizationID     uuid.UUID     `gorm:"type:uuid;not null;index:idx_accounts_organization_id"`
	ParentAccountID    uuid.NullUUID `gorm:"type:uuid;index:idx_accounts_parent_account_id"`
	DisplayName        string        `gorm:"not null;default:'';index:idx_accounts_display_name"`
	DisplayCode        string        `gorm:"not null;default:'';index:idx_accounts_display_code"`
	DisplayDescription string        `gorm:"not null;default:''"`
	IsContainer        bool          `gorm:"not null;default:false;index:idx_accounts_is_container"`
	IsArchived         bool          `gorm:"not null;default:false"`
	UpdatedAt          time.Time     `gorm:"not null;default:now()"`
	CreatedAt          time.Time     `gorm:"not null;default:now()"`

	// Relations
	Organization                  Organization                   `gorm:"foreignKey:OrganizationID"`
	ParentAccount                 *Account                       `gorm:"foreignKey:ParentAccountID"`
	ChildAccounts                 []Account                      `gorm:"foreignKey:ParentAccountID"`
	AccountGroupAssignments       []AccountGroupAssignment       `gorm:"foreignKey:AccountID"`
	BudgetTagAccountValues        []BudgetTagAccountValue        `gorm:"foreignKey:AccountID"`
	TransactionAccountAssignments []TransactionAccountAssignment `gorm:"foreignKey:AccountID"`
}

func (Account) TableName() string { return "accounts" }

func (m *Account) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Account) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
