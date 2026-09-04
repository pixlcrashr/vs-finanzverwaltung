package api

import (
	"github.com/danielgtaylor/huma/v2"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/api/importexport"
	"github.com/pixlcrashr/vsfv/pkg/api/importexport/xmlformat"
)

// RegisterRoutes wires all domain route groups onto the Huma API and Fiber app.
func RegisterRoutes(app *fiber.App, api huma.API, db *gorm.DB) {
	importexport.RegisterRoutes(api, db)
	xmlformat.RegisterRoutes(app, db)
}
