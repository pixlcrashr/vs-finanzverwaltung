package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Organization struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey"`
	DisplayName string    `gorm:"not null;default:''"`
	UpdatedAt   time.Time `gorm:"not null;default:now()"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`

	// Relations
	AccountGroupAssignments       []AccountGroupAssignment       `gorm:"foreignKey:OrganizationID"`
	AccountGroups                 []AccountGroup                 `gorm:"foreignKey:OrganizationID"`
	Accounts                      []Account                      `gorm:"foreignKey:OrganizationID"`
	BudgetTags                    []BudgetTag                    `gorm:"foreignKey:OrganizationID"`
	BudgetTagAccountValues        []BudgetTagAccountValue        `gorm:"foreignKey:OrganizationID"`
	Budgets                       []Budget                       `gorm:"foreignKey:OrganizationID"`
	ImportSourcePeriods           []ImportSourcePeriod           `gorm:"foreignKey:OrganizationID"`
	ImportSources                 []ImportSource                 `gorm:"foreignKey:OrganizationID"`
	ReportTemplates               []ReportTemplate               `gorm:"foreignKey:OrganizationID"`
	Reports                       []Report                       `gorm:"foreignKey:OrganizationID"`
	Transactions                  []Transaction_                 `gorm:"foreignKey:OrganizationID"`
	TransactionAccountAssignments []TransactionAccountAssignment `gorm:"foreignKey:OrganizationID"`
	TransactionAccounts           []TransactionAccount           `gorm:"foreignKey:OrganizationID"`
	UserGroups                    []UserGroup                    `gorm:"foreignKey:OrganizationID"`
}

func (Organization) TableName() string { return "organizations" }

func (m *Organization) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}

func (m *Organization) Exists() bool {
	return m != nil && m.ID != uuid.Nil
}
