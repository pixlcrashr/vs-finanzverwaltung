package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetRevisionAccountValue struct {
	ID               uuid.UUID   `gorm:"type:uuid;primaryKey"`
	BudgetRevisionID uuid.UUID   `gorm:"type:uuid;not null;index:idx_budget_revision_account_values_budget_id"`
	AccountID        uuid.UUID   `gorm:"type:uuid;not null;index:idx_budget_revision_account_values_account_id"`
	Value            apd.Decimal `gorm:"type:decimal;not null;default:0;index:idx_budget_revision_account_values_value"`
	UpdatedAt        time.Time   `gorm:"not null;default:now()"`
	CreatedAt        time.Time   `gorm:"not null;default:now()"`

	// Relations
	BudgetRevision BudgetRevision `gorm:"foreignKey:BudgetRevisionID"`
	Account        Account        `gorm:"foreignKey:AccountID"`
}

func (BudgetRevisionAccountValue) TableName() string { return "budget_revision_account_values" }

func (m *BudgetRevisionAccountValue) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *BudgetRevisionAccountValue) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
