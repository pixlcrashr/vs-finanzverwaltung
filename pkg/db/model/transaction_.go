package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Transaction_ has suffix due to naming conflicts when using Gorm DAOs.
type Transaction_ struct {
	ID                    uuid.UUID   `gorm:"type:uuid;primaryKey;uniqueIndex:idx_transactions_org_id,priority:1"`
	CustomID              string      `gorm:"uniqueIndex:idx_transactions_custom_id_org,priority:1"`
	OrganizationID        uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transactions_org_id,priority:2;uniqueIndex:idx_transactions_custom_id_org,priority:2"`
	CreditLedgerAccountID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transactions_unique_entry,priority:1"`
	DebitLedgerAccountID  uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transactions_unique_entry,priority:2"`
	Amount                apd.Decimal `gorm:"type:decimal;not null;uniqueIndex:idx_transactions_unique_entry,priority:3"`
	Description           string      `gorm:"not null;default:'';uniqueIndex:idx_transactions_unique_entry,priority:4"`
	Reference             string      `gorm:"not null;default:'';uniqueIndex:idx_transactions_unique_entry,priority:5"`
	BookedAt              time.Time   `gorm:"type:date;not null;default:CURRENT_TIMESTAMP;uniqueIndex:idx_transactions_unique_entry,priority:6"`
	DocumentDate          time.Time   `gorm:"type:date;not null;default:CURRENT_TIMESTAMP;uniqueIndex:idx_transactions_unique_entry,priority:7"`
	UpdatedAt             time.Time   `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt             time.Time   `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relations
	Organization           Organization            `gorm:"foreignKey:OrganizationID"`
	CreditLedgerAccount    LedgerAccount           `gorm:"foreignKey:CreditLedgerAccountID"`
	DebitLedgerAccount     LedgerAccount           `gorm:"foreignKey:DebitLedgerAccountID"`
	TransactionAssignments []TransactionAssignment `gorm:"foreignKey:TransactionID"`
}

func (Transaction_) TableName() string { return "transactions" }

func (m *Transaction_) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *Transaction_) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
