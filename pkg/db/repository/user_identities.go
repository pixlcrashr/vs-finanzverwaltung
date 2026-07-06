package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

var (
	ErrUserIdentityNotFound = errors.New("user identity not found")
)

type ListUserIdentitiesParams struct {
	UserID   uuid.UUID
	Page     int
	PageSize int
}

type UserIdentityRepository struct {
	db *gorm.DB
	q  *dao.Query
}

func NewUserIdentityRepository(db *gorm.DB) *UserIdentityRepository {
	return &UserIdentityRepository{db: db, q: dao.Use(db)}
}

func (r *UserIdentityRepository) List(ctx context.Context, params ListUserIdentitiesParams) ([]*model.UserIdentity, int64, error) {
	if params.PageSize <= 0 {
		params.PageSize = 20
	}
	if params.Page <= 0 {
		params.Page = 1
	}

	base := r.q.UserIdentity.WithContext(ctx).Where(r.q.UserIdentity.UserID.Eq(params.UserID))

	total, err := base.Count()
	if err != nil {
		return nil, 0, fmt.Errorf("count user identities user_id=%s: %w", params.UserID, err)
	}

	offset := (params.Page - 1) * params.PageSize

	ms, err := base.Order(r.q.UserIdentity.CreatedAt.Asc()).Offset(offset).Limit(params.PageSize).Find()
	if err != nil {
		return nil, 0, fmt.Errorf("list user identities user_id=%s: %w", params.UserID, err)
	}

	return ms, total, nil
}

func (r *UserIdentityRepository) GetByID(ctx context.Context, id uuid.UUID) (*model.UserIdentity, error) {
	m, err := r.q.UserIdentity.WithContext(ctx).Where(r.q.UserIdentity.ID.Eq(id)).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserIdentityNotFound, fmt.Errorf("id=%s: %w", id, err))
		}
		return nil, fmt.Errorf("get user identity id=%s: %w", id, err)
	}
	return m, nil
}

func (r *UserIdentityRepository) GetByCustomID(ctx context.Context, userID uuid.UUID, customID string) (*model.UserIdentity, error) {
	m, err := r.q.UserIdentity.WithContext(ctx).Where(
		r.q.UserIdentity.UserID.Eq(userID),
		r.q.UserIdentity.CustomID.Eq(customID),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserIdentityNotFound, fmt.Errorf("user_id=%s custom_id=%s: %w", userID, customID, err))
		}
		return nil, fmt.Errorf("get user identity user_id=%s custom_id=%s: %w", userID, customID, err)
	}
	return m, nil
}

func (r *UserIdentityRepository) GetByProvider(ctx context.Context, provider string, providerUserID string) (*model.UserIdentity, error) {
	m, err := r.q.UserIdentity.WithContext(ctx).Where(
		r.q.UserIdentity.Provider.Eq(provider),
		r.q.UserIdentity.ProviderUserID.Eq(providerUserID),
	).First()
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserIdentityNotFound, fmt.Errorf("provider=%s provider_user_id=%s: %w", provider, providerUserID, err))
		}
		return nil, fmt.Errorf("get user identity provider=%s provider_user_id=%s: %w", provider, providerUserID, err)
	}
	return m, nil
}

func (r *UserIdentityRepository) Create(ctx context.Context, m *model.UserIdentity) error {
	if err := r.q.UserIdentity.WithContext(ctx).Create(m); err != nil {
		return fmt.Errorf("create user identity: %w", err)
	}
	return nil
}
