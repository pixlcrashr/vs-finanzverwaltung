package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ViewAccountAssignment struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	ViewID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_view_account_assignments_unique,priority:1;index:idx_view_account_assignments_view_id"`
	AccountID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_view_account_assignments_unique,priority:2;index:idx_view_account_assignments_account_id"`
	CreatedAt time.Time `gorm:"not null;default:now()"`

	// Relations
	View    View    `gorm:"foreignKey:ViewID"`
	Account Account `gorm:"foreignKey:AccountID"`
}

func (ViewAccountAssignment) TableName() string { return "view_account_assignments" }

func (m *ViewAccountAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ViewAccountAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
