package auth

import (
	"net/http"

	"github.com/ory/fosite"
	"github.com/pixlcrashr/vsfv/pkg/authz"
)

// HTTPMiddleware wraps an http.Handler with Bearer token authentication.
// It introspects the token via fosite, extracts the user ID and granted scopes,
// and stores them in the request context for downstream handlers.
func HTTPMiddleware(oauth2 fosite.OAuth2Provider, sessionFactory func() fosite.Session) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			token := getBearerToken(r)
			if token == "" {
				writeJSONError(w, http.StatusUnauthorized, "invalid_token", "missing bearer token")
				return
			}

			ctx := r.Context()
			session := sessionFactory()

			_, ar, err := oauth2.IntrospectToken(ctx, token, fosite.AccessToken, session)
			if err != nil {
				writeJSONError(w, http.StatusUnauthorized, "invalid_token", "token validation failed")
				return
			}

			userID := ar.GetSession().GetSubject()
			if userID == "" {
				writeJSONError(w, http.StatusUnauthorized, "invalid_token", "no subject in token")
				return
			}

			var scopes []string
			if granted := ar.GetGrantedScopes(); granted != nil {
				scopes = granted
			}

			ctx = authz.WithUser(ctx, userID, scopes)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
