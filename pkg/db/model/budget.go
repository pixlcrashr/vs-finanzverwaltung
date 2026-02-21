package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Budget struct {
	ID                    uuid.UUID `gorm:"type:uuid;primaryKey"`
	DisplayName           string    `gorm:"not null;default:'';index:idx_budgets_display_name"`
	DisplayDescription    string    `gorm:"not null;default:''"`
	IsClosed              bool      `gorm:"not null;default:false"`
	PeriodStart           time.Time `gorm:"not null"`
	PeriodEnd             time.Time `gorm:"not null"`
	UpdatedAt             time.Time `gorm:"not null;default:now()"`
	CreatedAt             time.Time `gorm:"not null;default:now()"`

	// Relations
	BudgetRevisions       []BudgetRevision       `gorm:"foreignKey:BudgetID"`
	ViewBudgetAssignments []ViewBudgetAssignment `gorm:"foreignKey:BudgetID"`
}

func (Budget) TableName() string { return "budgets" }

func (m *Budget) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Budget) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
