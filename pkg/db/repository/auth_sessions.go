package repository

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

var (
	ErrAuthSessionNotFound = errors.New("auth session not found")
)

type AuthSessionRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewAuthSessionRepository(db *gorm.DB) *AuthSessionRepository {
	return &AuthSessionRepository{db: db, q: dao.Use(db)}
}

func (r *AuthSessionRepository) Create(ctx context.Context, userID uuid.UUID, ttl time.Duration) (*model.AuthSession, error) {
	token, err := generateSessionToken()
	if err != nil {
		return nil, fmt.Errorf("create auth session: %w", err)
	}
	m := &model.AuthSession{
		Token:     token,
		UserID:    userID,
		ExpiresAt: time.Now().UTC().Add(ttl),
	}
	if err := r.q.AuthSession.WithContext(ctx).Create(m); err != nil {
		return nil, fmt.Errorf("create auth session: %w", err)
	}
	return m, nil
}

func (r *AuthSessionRepository) GetByToken(ctx context.Context, token string) (*model.AuthSession, error) {
	m, err := r.q.AuthSession.WithContext(ctx).Where(r.q.AuthSession.Token.Eq(token)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrAuthSessionNotFound, fmt.Errorf("token=%s: %w", token, err))
		}
		return nil, fmt.Errorf("get auth session token=%s: %w", token, err)
	}
	return m, nil
}

func (r *AuthSessionRepository) DeleteByToken(ctx context.Context, token string) error {
	_, err := r.q.AuthSession.WithContext(ctx).Where(r.q.AuthSession.Token.Eq(token)).Delete()
	if err != nil {
		return fmt.Errorf("delete auth session token=%s: %w", token, err)
	}
	return nil
}

func (r *AuthSessionRepository) DeleteExpired(ctx context.Context) error {
	_, err := r.q.AuthSession.WithContext(ctx).Where(r.q.AuthSession.ExpiresAt.Lt(time.Now().UTC())).Delete()
	if err != nil {
		return fmt.Errorf("delete expired auth sessions: %w", err)
	}
	return nil
}

func generateSessionToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
