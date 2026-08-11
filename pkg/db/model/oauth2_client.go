package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/types"
	"gorm.io/gorm"
)

type OAuth2Client struct {
	ID                      uuid.UUID         `gorm:"type:uuid;primaryKey"`
	ClientID                string            `gorm:"not null;uniqueIndex:idx_oauth2_clients_client_id"`
	ClientName              string            `gorm:"not null;default:''"`
	ClientSecret            *string           `gorm:"default:null"`
	RedirectURIs            types.StringArray `gorm:"type:text[];default:'{}'"`
	GrantTypes              types.StringArray `gorm:"type:text[];default:'{}'"`
	ResponseTypes           types.StringArray `gorm:"type:text[];default:'{}'"`
	Scopes                  types.StringArray `gorm:"type:text[];default:'{}'"`
	TokenEndpointAuthMethod string            `gorm:"not null;default:'none'"`
	UserID                  *uuid.UUID        `gorm:"type:uuid;default:null"`
	Public                  bool              `gorm:"not null;default:false"`
	CreatedAt               time.Time         `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt               time.Time         `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

func (OAuth2Client) TableName() string { return "oauth2_clients" }

func (m *OAuth2Client) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *OAuth2Client) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
