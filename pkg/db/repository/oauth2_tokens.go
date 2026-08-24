package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/db/types"
	"gorm.io/gorm"
)

var (
	ErrOAuth2TokenNotFound = errors.New("oauth2 token not found")
)

type OAuth2TokenRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewOAuth2TokenRepository(db *gorm.DB) *OAuth2TokenRepository {
	return &OAuth2TokenRepository{db: db, q: dao.Use(db)}
}

type CreateOAuth2TokenParams struct {
	Signature    string
	RequestType  string
	ClientID     string
	UserID       sql.Null[uuid.UUID]
	Scope        types.StringArray
	GrantedScope types.StringArray
	FormData     string
	SessionData  string
	RequestedAt  interface{}
}

func (r *OAuth2TokenRepository) Create(ctx context.Context, params CreateOAuth2TokenParams) (*model.OAuth2Token, error) {
	m := &model.OAuth2Token{
		Signature:    params.Signature,
		RequestType:  params.RequestType,
		ClientID:     params.ClientID,
		UserID:       params.UserID,
		Scope:        params.Scope,
		GrantedScope: params.GrantedScope,
		FormData:     params.FormData,
		SessionData:  params.SessionData,
	}
	if err := r.q.OAuth2Token.WithContext(ctx).Create(m); err != nil {
		return nil, fmt.Errorf("create oauth2 token: %w", err)
	}
	return m, nil
}

func (r *OAuth2TokenRepository) GetBySignature(ctx context.Context, signature string, requestType string) (*model.OAuth2Token, error) {
	m, err := r.q.OAuth2Token.WithContext(ctx).Where(
		r.q.OAuth2Token.Signature.Eq(signature),
		r.q.OAuth2Token.RequestType.Eq(requestType),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrOAuth2TokenNotFound, fmt.Errorf("signature=%s type=%s: %w", signature, requestType, err))
		}
		return nil, fmt.Errorf("get oauth2 token signature=%s type=%s: %w", signature, requestType, err)
	}
	return m, nil
}

func (r *OAuth2TokenRepository) DeleteBySignature(ctx context.Context, signature string, requestType string) error {
	_, err := r.q.OAuth2Token.WithContext(ctx).Where(
		r.q.OAuth2Token.Signature.Eq(signature),
		r.q.OAuth2Token.RequestType.Eq(requestType),
	).Delete()
	if err != nil {
		return fmt.Errorf("delete oauth2 token signature=%s type=%s: %w", signature, requestType, err)
	}
	return nil
}

func (r *OAuth2TokenRepository) DeleteByClientID(ctx context.Context, clientID string) error {
	_, err := r.q.OAuth2Token.WithContext(ctx).Where(r.q.OAuth2Token.ClientID.Eq(clientID)).Delete()
	if err != nil {
		return fmt.Errorf("delete oauth2 tokens client_id=%s: %w", clientID, err)
	}
	return nil
}

func (r *OAuth2TokenRepository) DeleteExpired(ctx context.Context) error {
	// Delete tokens that are older than 30 days regardless of type.
	// This is a simple cleanup; individual token expiry is handled by fosite.
	_, err := r.q.OAuth2Token.WithContext(ctx).Where(r.q.OAuth2Token.RequestedAt.Lt(
		r.db.NowFunc().AddDate(0, 0, -30),
	)).Delete()
	if err != nil {
		return fmt.Errorf("delete expired oauth2 tokens: %w", err)
	}
	return nil
}
