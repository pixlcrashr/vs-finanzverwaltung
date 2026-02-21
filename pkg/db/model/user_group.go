package model

import "time"

// UserGroup uses a string primary key (not auto-generated UUID).
type UserGroup struct {
	ID          string    `gorm:"primaryKey;not null"`
	Name        string    `gorm:"not null;index:idx_user_groups_name"`
	Description string    `gorm:"not null;default:''"`
	IsSystem    bool      `gorm:"not null;default:false"`
	IsDefault   bool      `gorm:"not null;default:false"`
	CreatedAt   time.Time `gorm:"not null;default:now()"`
	UpdatedAt   time.Time `gorm:"not null;default:now()"`
}

func (UserGroup) TableName() string { return "user_groups" }
