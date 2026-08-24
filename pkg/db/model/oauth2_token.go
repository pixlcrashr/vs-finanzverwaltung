package model

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/types"
	"gorm.io/gorm"
)

// OAuth2Token is a generic fosite token storage table. It stores all token types
// (access_token, refresh_token, authorize_code, oidc_session, pkce_request) using
// the (Signature, RequestType) composite unique key.
type OAuth2Token struct {
	ID           uuid.UUID           `gorm:"type:uuid;primaryKey"`
	Signature    string              `gorm:"not null;uniqueIndex:idx_oauth2_tokens_signature_type,priority:1"`
	RequestType  string              `gorm:"not null;uniqueIndex:idx_oauth2_tokens_signature_type,priority:2;index:idx_oauth2_tokens_request_type"`
	ClientID     string              `gorm:"not null;index:idx_oauth2_tokens_client_id"`
	UserID       sql.Null[uuid.UUID] `gorm:"type:uuid;default:null;index:idx_oauth2_tokens_user_id"`
	Scope        types.StringArray   `gorm:"type:text[];default:'{}'"`
	GrantedScope types.StringArray   `gorm:"type:text[];default:'{}'"`
	FormData     string              `gorm:"type:text;default:''"`
	SessionData  string              `gorm:"type:text;default:''"`
	RequestedAt  time.Time           `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt    time.Time           `gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time           `gorm:"not null;default:CURRENT_TIMESTAMP"`
}

func (OAuth2Token) TableName() string { return "oauth2_tokens" }

func (m *OAuth2Token) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *OAuth2Token) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
