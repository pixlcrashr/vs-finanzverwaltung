package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Report struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	DisplayName string    `gorm:"not null;default:''"`
	Data        []byte    `gorm:"type:bytea;not null"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
}

func (Report) TableName() string { return "reports" }

func (m *Report) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Report) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
