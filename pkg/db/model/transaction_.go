package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Transaction_ has suffix due to naming conflicts when using Gorm DAOs.
type Transaction_ struct {
	ID                         uuid.UUID     `gorm:"type:uuid;primaryKey"`
	OrganizationID             uuid.UUID     `gorm:"type:uuid;not null;index:idx_transactions_organization_id"`
	CreditTransactionAccountID uuid.UUID     `gorm:"type:uuid;not null;uniqueIndex:idx_transactions_unique_entry,priority:1"`
	DebitTransactionAccountID  uuid.UUID     `gorm:"type:uuid;not null;uniqueIndex:idx_transactions_unique_entry,priority:2"`
	Amount                     apd.Decimal   `gorm:"type:decimal;not null;uniqueIndex:idx_transactions_unique_entry,priority:3"`
	Description                string        `gorm:"not null;default:'';uniqueIndex:idx_transactions_unique_entry,priority:4"`
	Reference                  string        `gorm:"not null;default:'';uniqueIndex:idx_transactions_unique_entry,priority:5"`
	BookedAt                   time.Time     `gorm:"type:date;not null;default:now();uniqueIndex:idx_transactions_unique_entry,priority:6"`
	DocumentDate               time.Time     `gorm:"type:date;not null;default:now();uniqueIndex:idx_transactions_unique_entry,priority:7"`
	AssignedAccountID          uuid.NullUUID `gorm:"type:uuid"`
	UpdatedAt                  time.Time     `gorm:"not null;default:now()"`
	CreatedAt                  time.Time     `gorm:"not null;default:now()"`

	// Relations
	Organization                  Organization                   `gorm:"foreignKey:OrganizationID"`
	CreditTransactionAccount      TransactionAccount             `gorm:"foreignKey:CreditTransactionAccountID"`
	DebitTransactionAccount       TransactionAccount             `gorm:"foreignKey:DebitTransactionAccountID"`
	TransactionAccountAssignments []TransactionAccountAssignment `gorm:"foreignKey:TransactionID"`
}

func (Transaction_) TableName() string { return "transactions" }

func (m *Transaction_) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Transaction_) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
