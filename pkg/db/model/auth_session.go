package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuthSession represents a server-side login session used between the login
// API endpoint and the OAuth2 authorize endpoint.
type AuthSession struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey"`
	Token     string    `gorm:"not null;uniqueIndex:idx_auth_sessions_token"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_auth_sessions_user_id"`
	ExpiresAt time.Time `gorm:"not null"`
	CreatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

func (AuthSession) TableName() string { return "auth_sessions" }

func (m *AuthSession) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *AuthSession) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
