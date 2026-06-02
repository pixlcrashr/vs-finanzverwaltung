package services

import (
	"strings"

	"gorm.io/gorm"
)

// isNotFound returns true when err is a GORM not-found error.
func isNotFound(err error) bool {
	return err != nil && (err == gorm.ErrRecordNotFound || strings.Contains(err.Error(), "record not found"))
}
