package api

import (
	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/api/importexport"
)

// RegisterRoutes wires all domain route groups onto the Huma API.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	importexport.RegisterRoutes(api, db)
}
