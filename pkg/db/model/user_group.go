package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// UserGroup uses a string primary key (not auto-generated UUID).
type UserGroup struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	Name        string    `gorm:"not null;index:idx_user_groups_name"`
	Description string    `gorm:"not null;default:''"`
	IsSystem    bool      `gorm:"not null;default:false"`
	IsDefault   bool      `gorm:"not null;default:false"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
	UpdatedAt   time.Time `gorm:"not null;default:now()"`
}

func (UserGroup) TableName() string { return "user_groups" }

func (m *UserGroup) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *UserGroup) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
