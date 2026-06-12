package services

import (
	"strings"

	"gorm.io/gorm"
)

// isNotFound returns true when err is a GORM not-found error.
func isNotFound(err error) bool {
	return err != nil && (err == gorm.ErrRecordNotFound || strings.Contains(err.Error(), "record not found"))
}

// isDuplicateKey returns true when err is a unique-constraint violation.
func isDuplicateKey(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate key value violates unique constraint")
}
