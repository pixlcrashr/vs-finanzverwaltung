package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetTag struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey"`
	OrganizationID     uuid.UUID `gorm:"type:uuid;not null;index:idx_budget_tags_organization_id"`
	BudgetID           uuid.UUID `gorm:"type:uuid;not null;index:idx_budget_revisions_budget_id"`
	Date               time.Time `gorm:"not null;index:idx_budget_revisions_date"`
	DisplayDescription string    `gorm:"not null;default:''"`
	UpdatedAt          time.Time `gorm:"not null;default:now()"`
	CreatedAt          time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization           Organization            `gorm:"foreignKey:OrganizationID"`
	Budget                 Budget                  `gorm:"foreignKey:BudgetID"`
	BudgetTagAccountValues []BudgetTagAccountValue `gorm:"foreignKey:BudgetTagID"`
}

func (BudgetTag) TableName() string { return "budget_revisions" }

func (m *BudgetTag) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *BudgetTag) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
