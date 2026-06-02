package model

import (
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetRevisionAccountValue struct {
	ID             uuid.UUID   `gorm:"type:uuid;primaryKey;uniqueIndex:idx_budget_tag_account_values_org_id,priority:1"`
	OrganizationID uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_budget_tag_account_values_org_id,priority:2;uniqueIndex:idx_budget_tag_account_values_org_tag_account,priority:1"`
	BudgetTagID    uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_budget_tag_account_values_org_tag_account,priority:2"`
	AccountID      uuid.UUID   `gorm:"type:uuid;not null;uniqueIndex:idx_budget_tag_account_values_org_tag_account,priority:3"`
	Value          apd.Decimal `gorm:"type:decimal;not null;default:0;index:idx_budget_revision_account_values_value"`
	UpdatedAt      time.Time   `gorm:"not null;default:now()"`
	CreatedAt      time.Time   `gorm:"not null;default:now()"`

	// Relations
	Organization   Organization   `gorm:"foreignKey:OrganizationID"`
	BudgetRevision BudgetRevision `gorm:"foreignKey:BudgetTagID"`
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
