package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionAssignment struct {
	ID             uuid.UUID   `gorm:"type:uuid;primaryKey;uniqueIndex:idx_transaction_assignments_org_id,priority:1"`
	OrganizationID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_transaction_assignments_org_id,priority:2"`
	TransactionID  uuid.UUID   `gorm:"type:uuid;not null"`
	AccountID      uuid.UUID   `gorm:"type:uuid;not null"`
	Value          apd.Decimal `gorm:"type:decimal;not null"`
	UpdatedAt      time.Time   `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt      time.Time   `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
	Transaction  Transaction_ `gorm:"foreignKey:TransactionID"`
	Account      Account      `gorm:"foreignKey:AccountID"`
}

func (TransactionAssignment) TableName() string { return "transaction_assignments" }

func (m *TransactionAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	return nil
}

func (m *TransactionAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
