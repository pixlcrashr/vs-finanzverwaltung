package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GroupOrganization is a join table that assigns a UserGroup to an Organization.
// This is the source of truth for group-to-organization assignments; Casbin g3
// entries are synced from this table.
type GroupOrganization struct {
	ID             uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserGroupID    uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_group_organizations_group_org,priority:1"`
	OrganizationID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_group_organizations_group_org,priority:2"`
	CreatedAt      time.Time `gorm:"not null;default:now()"`

	// Relations
	UserGroup    UserGroup    `gorm:"foreignKey:UserGroupID"`
	Organization Organization `gorm:"foreignKey:OrganizationID"`
}

func (GroupOrganization) TableName() string { return "group_organizations" }

func (m *GroupOrganization) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *GroupOrganization) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
