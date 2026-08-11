package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserSettings struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID             uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_settings_user_id"`
	Locale             string    `gorm:"not null;default:''"`
	Theme              string    `gorm:"not null;default:'system'"`
	EmailNotifications bool      `gorm:"not null;default:false"`
	UpdatedAt          time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relations
	User User `gorm:"foreignKey:UserID"`
}

func (UserSettings) TableName() string { return "user_settings" }

func (m *UserSettings) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *UserSettings) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
