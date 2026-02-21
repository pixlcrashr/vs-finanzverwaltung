package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetRevision struct {
	ID                          uuid.UUID `gorm:"type:uuid;primaryKey"`
	BudgetID                    uuid.UUID `gorm:"type:uuid;not null;index:idx_budget_revisions_budget_id"`
	Date                        time.Time `gorm:"not null;index:idx_budget_revisions_date"`
	DisplayDescription          string    `gorm:"not null;default:''"`
	UpdatedAt                   time.Time `gorm:"not null;default:now()"`
	CreatedAt                   time.Time `gorm:"not null;default:now()"`

	// Relations
	Budget                      Budget                         `gorm:"foreignKey:BudgetID"`
	BudgetRevisionAccountValues []BudgetRevisionAccountValue   `gorm:"foreignKey:BudgetRevisionID"`
}

func (BudgetRevision) TableName() string { return "budget_revisions" }

func (m *BudgetRevision) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *BudgetRevision) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
