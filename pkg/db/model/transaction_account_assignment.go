package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionAccountAssignment struct {
	ID             uuid.UUID   `gorm:"type:uuid;primaryKey;uniqueIndex:idx_transaction_account_assignments_org_id,priority:1"`
	OrganizationID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transaction_account_assignments_org_id,priority:2;uniqueIndex:idx_transaction_account_assignments_org_trans_account,priority:1"`
	TransactionID  uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transaction_account_assignments_org_trans_account,priority:2"`
	AccountID      uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transaction_account_assignments_org_trans_account,priority:3"`
	Value          apd.Decimal `gorm:"type:decimal;not null"`
	CreatedAt      time.Time   `gorm:"not null;default:now()"`
	UpdatedAt      time.Time   `gorm:"not null;default:now()"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
	Transaction  Transaction_ `gorm:"foreignKey:TransactionID"`
	Account      Account      `gorm:"foreignKey:AccountID"`
}

func (TransactionAccountAssignment) TableName() string { return "transaction_account_assignments" }

func (m *TransactionAccountAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *TransactionAccountAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
