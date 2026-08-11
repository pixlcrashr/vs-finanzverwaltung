package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"gorm.io/gorm"
)

var (
	ErrUserSettingsNotFound = errors.New("user settings not found")
)

type UserSettingsRepository struct {
	db *gorm.DB
}

func NewUserSettingsRepository(db *gorm.DB) *UserSettingsRepository {
	return &UserSettingsRepository{db: db}
}

// GetByUserID returns the settings for the given user.
// If no settings exist yet, returns ErrUserSettingsNotFound.
func (r *UserSettingsRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*model.UserSettings, error) {
	var m model.UserSettings
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&m).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.Join(ErrUserSettingsNotFound, fmt.Errorf("user_id=%s: %w", userID, err))
		}
		return nil, fmt.Errorf("get user settings user_id=%s: %w", userID, err)
	}
	return &m, nil
}

// Upsert creates or updates the settings for a user.
func (r *UserSettingsRepository) Upsert(ctx context.Context, userID uuid.UUID, locale, theme string, emailNotifications bool) (*model.UserSettings, error) {
	var m model.UserSettings
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&m).Error
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("upsert user settings lookup user_id=%s: %w", userID, err)
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		m = model.UserSettings{
			UserID:             userID,
			Locale:             locale,
			Theme:              theme,
			EmailNotifications: emailNotifications,
		}
		if err := r.db.WithContext(ctx).Create(&m).Error; err != nil {
			return nil, fmt.Errorf("create user settings user_id=%s: %w", userID, err)
		}
		return &m, nil
	}

	if locale != "" {
		m.Locale = locale
	}
	if theme != "" {
		m.Theme = theme
	}
	m.EmailNotifications = emailNotifications

	if err := r.db.WithContext(ctx).Save(&m).Error; err != nil {
		return nil, fmt.Errorf("update user settings user_id=%s: %w", userID, err)
	}

	return &m, nil
}
