package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type View struct {
	ID                          uuid.UUID `gorm:"type:uuid;primaryKey"`
	DisplayName                 string    `gorm:"not null;default:'';index:idx_views_display_name"`
	DisplayDescription          string    `gorm:"not null;default:'';index:idx_views_display_description"`
	UpdatedAt                   time.Time `gorm:"not null;default:now()"`
	CreatedAt                   time.Time `gorm:"not null;default:now()"`

	// Relations
	ViewAccountAssignments      []ViewAccountAssignment      `gorm:"foreignKey:ViewID"`
	ViewAccountGroupAssignments []ViewAccountGroupAssignment `gorm:"foreignKey:ViewID"`
	ViewBudgetAssignments       []ViewBudgetAssignment       `gorm:"foreignKey:ViewID"`
}

func (View) TableName() string { return "views" }

func (m *View) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *View) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
