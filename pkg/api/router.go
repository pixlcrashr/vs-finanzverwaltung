package api

import (
	"github.com/danielgtaylor/huma/v2"

	"github.com/pixlcrashr/vsfv/pkg/api/items"
	"github.com/pixlcrashr/vsfv/pkg/api/test"
)

// RegisterRoutes wires all domain route groups onto the Huma API.
func RegisterRoutes(api huma.API) {
	test.RegisterRoutes(api)
	items.RegisterRoutes(api)
}
