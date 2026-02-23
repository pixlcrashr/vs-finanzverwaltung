package api

import (
	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/api/accountsexample"
	"github.com/pixlcrashr/vsfv/pkg/api/test"
)

// RegisterRoutes wires all domain route groups onto the Huma API.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	test.RegisterRoutes(api)
	accountsexample.RegisterRoutes(api, db)
}
