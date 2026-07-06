package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey"`
	Email        string    `gorm:"not null;uniqueIndex;index:idx_users_email"`
	Name         string    `gorm:"not null"`
	Picture      *string   `gorm:"default:null"`
	PasswordHash *string   `gorm:"default:null"`
	CreatedAt    time.Time `gorm:"not null;default:now()"`
	UpdatedAt    time.Time `gorm:"not null;default:now()"`

	// Relations
	UserIdentities []UserIdentity `gorm:"foreignKey:UserID"`
}

func (User) TableName() string { return "users" }

func (m *User) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *User) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
