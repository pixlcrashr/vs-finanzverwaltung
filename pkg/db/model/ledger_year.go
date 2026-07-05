package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LedgerYear struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_ledger_years_org_id,priority:1"`
	CustomID       string    `gorm:"uniqueIndex:idx_ledger_years_custom_id,priority:1"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_ledger_years_org_id,priority:2;uniqueIndex:idx_ledger_years_custom_id,priority:2;uniqueIndex:idx_ledger_years_org_year,priority:1"`
	Year           int       `gorm:"not null;default:0;uniqueIndex:idx_ledger_years_org_year,priority:2"`
	IsClosed       bool      `gorm:"not null;default:false"`
	UpdatedAt      time.Time `gorm:"not null;default:now()"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	Organization Organization `gorm:"foreignKey:OrganizationID"`
}

func (LedgerYear) TableName() string { return "ledger_years" }

func (m *LedgerYear) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *LedgerYear) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
