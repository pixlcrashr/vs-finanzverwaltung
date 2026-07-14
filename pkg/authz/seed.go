package authz

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"gorm.io/gorm"
)

const AdminGroupCustomID = "admin"

// SeedAdminGroup ensures that the admin system group exists and has all
// permissions (wildcard policy: domain=*, resource=*, action=*).
// It creates the group if missing, and re-syncs the wildcard policy on every
// startup to guarantee the admin group always has full access.
func SeedAdminGroup(ctx context.Context, db *gorm.DB, enforcer *Enforcer) error {
	var group model.UserGroup
	err := db.WithContext(ctx).Where("custom_id = ?", AdminGroupCustomID).First(&group).Error
	if err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("authz: check admin group: %w", err)
		}

		log.Printf("Seeding admin system group %q", AdminGroupCustomID)

		group = model.UserGroup{
			CustomID:    AdminGroupCustomID,
			Name:        "admin",
			Description: "System group with all permissions. Cannot be edited or deleted.",
			IsSystem:    true,
		}

		if err := db.WithContext(ctx).Create(&group).Error; err != nil {
			return fmt.Errorf("authz: create admin group: %w", err)
		}
	}

	// Re-sync the wildcard policy on every startup to ensure the admin group
	// always has all permissions, even if the casbin model or policy format changes.
	if _, err := enforcer.RemoveFilteredPolicy(0, group.ID.String()); err != nil {
		return fmt.Errorf("authz: clear admin policies: %w", err)
	}

	if _, err := enforcer.AddPolicy(group.ID.String(), "*", "*"); err != nil {
		return fmt.Errorf("authz: add admin wildcard policy: %w", err)
	}

	if err := enforcer.Flush(); err != nil {
		return fmt.Errorf("authz: flush after admin seed: %w", err)
	}

	return nil
}
