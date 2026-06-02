package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetAccountValue struct {
	ID             uuid.UUID   `gorm:"type:uuid;primaryKey;uniqueIndex:idx_budget_account_values_org_id,priority:1"`
	OrganizationID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_budget_account_values_org_id,priority:2;uniqueIndex:idx_budget_account_values_org_budget_account,priority:1"`
	BudgetID       uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_budget_account_values_org_budget_account,priority:2"`
	AccountID      uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_budget_account_values_org_budget_account,priority:3"`
	Value          apd.Decimal `gorm:"type:decimal;not null;default:0"`
	UpdatedAt      time.Time   `gorm:"not null;default:now()"`
	CreatedAt      time.Time   `gorm:"not null;default:now()"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
	Budget       Budget       `gorm:"foreignKey:BudgetID"`
	Account      Account      `gorm:"foreignKey:AccountID"`
}

func (BudgetAccountValue) TableName() string { return "budget_account_values" }

func (m *BudgetAccountValue) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *BudgetAccountValue) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
