package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ViewAccountGroupAssignment struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	ViewID         uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_view_account_group_assignments_view_group"`
	AccountGroupID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_view_account_group_assignments_view_group"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	View         View         `gorm:"foreignKey:ViewID"`
	AccountGroup AccountGroup `gorm:"foreignKey:AccountGroupID"`
}

func (ViewAccountGroupAssignment) TableName() string { return "view_account_group_assignments" }

func (m *ViewAccountGroupAssignment) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *ViewAccountGroupAssignment) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
