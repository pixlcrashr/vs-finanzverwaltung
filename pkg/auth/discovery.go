package auth

import (
	"github.com/gofiber/fiber/v2"
)

type DiscoveryConfig struct {
	Issuer                            string   `json:"issuer"`
	AuthorizationEndpoint             string   `json:"authorization_endpoint"`
	TokenEndpoint                     string   `json:"token_endpoint"`
	UserinfoEndpoint                  string   `json:"userinfo_endpoint"`
	JwksURI                           string   `json:"jwks_uri"`
	RevocationEndpoint                string   `json:"revocation_endpoint"`
	IntrospectionEndpoint             string   `json:"introspection_endpoint"`
	EndSessionEndpoint                string   `json:"end_session_endpoint,omitempty"`
	ResponseTypesSupported            []string `json:"response_types_supported"`
	GrantTypesSupported               []string `json:"grant_types_supported"`
	SubjectTypesSupported             []string `json:"subject_types_supported"`
	IDTokenSigningAlgValuesSupported  []string `json:"id_token_signing_alg_values_supported"`
	ScopesSupported                   []string `json:"scopes_supported"`
	TokenEndpointAuthMethodsSupported []string `json:"token_endpoint_auth_methods_supported"`
	CodeChallengeMethodsSupported     []string `json:"code_challenge_methods_supported"`
}

func (s *Server) DiscoveryHandler(c *fiber.Ctx) error {
	issuer := s.publicURL

	config := DiscoveryConfig{
		Issuer:                issuer,
		AuthorizationEndpoint: issuer + "/oauth2/authorize",
		TokenEndpoint:         issuer + "/oauth2/token",
		UserinfoEndpoint:      issuer + "/oauth2/userinfo",
		JwksURI:               issuer + "/.well-known/jwks.json",
		RevocationEndpoint:    issuer + "/oauth2/revoke",
		IntrospectionEndpoint: issuer + "/oauth2/introspect",
		ResponseTypesSupported: []string{
			"code",
			"token",
			"id_token",
			"code token",
			"code id_token",
			"token id_token",
			"code token id_token",
		},
		GrantTypesSupported: []string{
			"authorization_code",
			"refresh_token",
			"client_credentials",
		},
		SubjectTypesSupported:             []string{"public"},
		ScopesSupported:                   []string{"openid", "profile", "email", "offline"},
		TokenEndpointAuthMethodsSupported: []string{"none", "client_secret_basic", "client_secret_post"},
		CodeChallengeMethodsSupported:     []string{"S256", "plain"},
	}

	if s.keyManager != nil {
		config.IDTokenSigningAlgValuesSupported = s.keyManager.SigningAlgorithms()
	}

	return c.JSON(config)
}
