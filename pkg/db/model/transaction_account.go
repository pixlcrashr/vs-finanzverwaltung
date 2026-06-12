package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionAccount struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_transaction_accounts_org_id,priority:1"`
	CustomID           string    `gorm:"uniqueIndex:idx_transaction_accounts_custom_id_org,priority:1"`
	OrganizationID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_transaction_accounts_org_id,priority:2;uniqueIndex:idx_transaction_accounts_org_code_source,priority:1;uniqueIndex:idx_transaction_accounts_custom_id_org,priority:2"`
	Code               string    `gorm:"type:varchar(64);not null;uniqueIndex:idx_transaction_accounts_org_code_source,priority:2;index:idx_transaction_accounts_code"`
	ImportSourceID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_transaction_accounts_org_code_source,priority:3"`
	DisplayName        string    `gorm:"not null;default:'';index:idx_transaction_accounts_display_name"`
	DisplayDescription string    `gorm:"not null;default:''"`
	UpdatedAt          time.Time `gorm:"not null;default:now()"`
	CreatedAt          time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization       Organization   `gorm:"foreignKey:OrganizationID"`
	ImportSource       *ImportSource  `gorm:"foreignKey:ImportSourceID"`
	CreditTransactions []Transaction_ `gorm:"foreignKey:CreditTransactionAccountID"`
	DebitTransactions  []Transaction_ `gorm:"foreignKey:DebitTransactionAccountID"`
}

func (TransactionAccount) TableName() string { return "transaction_accounts" }

func (m *TransactionAccount) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *TransactionAccount) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
