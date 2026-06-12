package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserIdentity struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	CustomID       string    `gorm:"uniqueIndex:idx_user_identities_custom_id,priority:1"`
	UserID         uuid.UUID `gorm:"type:uuid;not null;index:idx_user_identities_user_id;uniqueIndex:idx_user_identities_custom_id,priority:2"`
	Provider       string    `gorm:"not null;index:idx_user_identities_provider;uniqueIndex:idx_user_identities_provider_user,priority:1"`
	ProviderUserID string    `gorm:"not null;uniqueIndex:idx_user_identities_provider_user,priority:2"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`
	UpdatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	User User `gorm:"foreignKey:UserID"`
}

func (UserIdentity) TableName() string { return "user_identities" }

func (m *UserIdentity) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *UserIdentity) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
