package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ViewBudgetAssignment struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	ViewID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_view_budget_assignments_view_budget"`
	BudgetID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_view_budget_assignments_view_budget"`
	CreatedAt time.Time `gorm:"not null;default:now()"`

	// Relations
	View   View   `gorm:"foreignKey:ViewID"`
	Budget Budget `gorm:"foreignKey:BudgetID"`
}

func (ViewBudgetAssignment) TableName() string { return "view_budget_assignments" }

func (m *ViewBudgetAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ViewBudgetAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
