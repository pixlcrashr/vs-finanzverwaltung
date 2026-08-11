package auth

import (
	"github.com/gofiber/fiber/v2"
)

// RegisterRoutes registers all OAuth2/OIDC routes on the Fiber app.
// Routes are conditionally registered based on config flags.
func RegisterRoutes(app *fiber.App, srv *Server, gitlab *GitLabHandler) {
	// OIDC discovery and JWKS are always available
	app.Get("/.well-known/openid-configuration", srv.DiscoveryHandler)
	app.Get("/.well-known/jwks.json", srv.JWKSHandler)

	// OAuth2 endpoints (always available)
	app.Get("/oauth2/authorize", srv.AuthorizeHandler)
	app.Post("/oauth2/authorize", srv.AuthorizeHandler)
	app.Post("/oauth2/token", srv.TokenHandler)
	app.Post("/oauth2/revoke", srv.RevokeHandler)
	app.Post("/oauth2/introspect", srv.IntrospectHandler)
	app.Get("/oauth2/userinfo", srv.UserInfoHandler)

	// Session endpoints
	app.Post("/auth/logout", srv.LogoutHandler)
	app.Get("/auth/me", srv.MeHandler)

	// GitLab login (conditional)
	if gitlab != nil && gitlab.IsEnabled() {
		app.Get("/auth/gitlab", gitlab.GitLabLoginInitiate)
		app.Get("/auth/gitlab/callback", gitlab.GitLabLoginCallback)
	}
}
