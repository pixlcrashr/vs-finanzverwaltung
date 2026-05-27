package api

import (
	"strings"

	"github.com/danielgtaylor/huma/v2"
	"github.com/danielgtaylor/huma/v2/adapters/humafiber"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/cfg"
)

// Server wraps the Fiber app and the Huma API instance.
type Server struct {
	app *fiber.App
	API huma.API
}

// New creates a Server, registers all routes, and returns it ready to listen.
// db is threaded through so domain services can be injected as the API grows.
func New(db *gorm.DB, version string, corsCfg cfg.CORS) *Server {
	app := fiber.New(fiber.Config{
		// Disable default startup banner — the serve command prints its own.
		DisableStartupMessage: true,
		CaseSensitive:         true,
		ETag:                  true,
	})

	if corsCfg.Enabled {
		app.Use(cors.New(cors.Config{
			AllowOrigins:     strings.Join(corsCfg.AllowOrigins, ","),
			AllowMethods:     strings.Join(corsCfg.AllowMethods, ","),
			AllowHeaders:     strings.Join(corsCfg.AllowHeaders, ","),
			ExposeHeaders:    strings.Join(corsCfg.ExposeHeaders, ","),
			AllowCredentials: corsCfg.AllowCredentials,
			MaxAge:           corsCfg.MaxAge,
		}))
	}

	humaConfig := huma.DefaultConfig("VS-Finanzverwaltung API", version)
	api := humafiber.New(app, humaConfig)

	s := &Server{app: app, API: api}
	RegisterRoutes(s.API, db)
	return s
}

// Listen starts the HTTP server on the given address (e.g. "127.0.0.1:8080").
func (s *Server) Listen(addr string) error {
	return s.app.Listen(addr)
}

// Shutdown gracefully drains in-flight requests.
func (s *Server) Shutdown() error {
	return s.app.Shutdown()
}
