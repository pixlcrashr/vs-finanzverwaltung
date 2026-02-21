package model

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CasbinRule struct {
	ID    uuid.UUID `gorm:"type:uuid;primaryKey"`
	Ptype string    `gorm:"not null;index:idx_casbin_rule_ptype"`
	V0    *string   `gorm:"default:null;index:idx_casbin_rule_v0"`
	V1    *string   `gorm:"default:null;index:idx_casbin_rule_v1"`
	V2    *string   `gorm:"default:null;index:idx_casbin_rule_v2"`
	V3    *string   `gorm:"default:null"`
	V4    *string   `gorm:"default:null"`
	V5    *string   `gorm:"default:null"`
}

func (CasbinRule) TableName() string { return "casbin_rule" }

func (m *CasbinRule) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *CasbinRule) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
