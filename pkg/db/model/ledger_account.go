package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AccountType mirrors the proto AccountType enum
type AccountType int

const (
	AccountTypeUnspecified AccountType = iota
	AccountTypeAsset
	AccountTypeLiability
	AccountTypeEquity
	AccountTypeRevenue
	AccountTypeExpense
	AccountTypeSystem
)

type LedgerAccount struct {
	ID                 uuid.UUID   `gorm:"type:uuid;primaryKey;uniqueIndex:idx_ledger_accounts_org_id,priority:1"`
	CustomID           string      `gorm:"uniqueIndex:idx_ledger_accounts_custom_id,priority:1"`
	OrganizationID     uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_ledger_accounts_org_id,priority:2;uniqueIndex:idx_ledger_accounts_org_code,priority:1;uniqueIndex:idx_ledger_accounts_custom_id,priority:2"`
	Code               string      `gorm:"type:varchar(64);not null;uniqueIndex:idx_ledger_accounts_org_code,priority:2;index:idx_ledger_accounts_code"`
	AccountType        AccountType `gorm:"type:int;not null;default:0"`
	DisplayName        string      `gorm:"not null;default:'';index:idx_ledger_accounts_display_name"`
	DisplayDescription string      `gorm:"not null;default:''"`
	UpdatedAt          time.Time   `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt          time.Time   `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relations
	Organization       Organization   `gorm:"foreignKey:OrganizationID"`
	CreditTransactions []Transaction_ `gorm:"foreignKey:CreditLedgerAccountID"`
	DebitTransactions  []Transaction_ `gorm:"foreignKey:DebitLedgerAccountID"`
}

func (LedgerAccount) TableName() string { return "ledger_accounts" }

func (m *LedgerAccount) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *LedgerAccount) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
