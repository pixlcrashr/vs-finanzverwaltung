package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetRevision struct {
	ID                 uuid.UUID `gorm:"type:uuid;primaryKey;uniqueIndex:idx_budget_tags_org_id,priority:1"`
	CustomID           string    `gorm:"uniqueIndex:idx_budget_revisions_custom_id,priority:1"`
	OrganizationID     uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_budget_tags_org_id,priority:2;index:idx_budget_tags_org_budget,priority:1;uniqueIndex:idx_budget_revisions_custom_id,priority:2"`
	BudgetID           uuid.UUID `gorm:"type:uuid;not null;index:idx_budget_tags_org_budget,priority:2;uniqueIndex:idx_budget_revisions_custom_id,priority:3"`
	DisplayName        string    `gorm:"not null;default:''"`
	DisplayDescription string    `gorm:"not null;default:''"`
	IsPublished        bool      `gorm:"not null;default:false"`
	Date               time.Time `gorm:"not null;index:idx_budget_revisions_date"`
	UpdatedAt          time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt          time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`

	// Relations
	Organization                Organization                 `gorm:"foreignKey:OrganizationID"`
	Budget                      Budget                       `gorm:"foreignKey:BudgetID"`
	BudgetRevisionAccountValues []BudgetRevisionAccountValue `gorm:"foreignKey:BudgetRevisionID"`
}

func (BudgetRevision) TableName() string { return "budget_revisions" }

func (m *BudgetRevision) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}

	if m.CustomID == "" {
		m.CustomID = m.ID.String()
	}

	return nil
}

func (m *BudgetRevision) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
