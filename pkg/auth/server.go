package auth

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/ory/fosite"
	"github.com/ory/fosite/compose"
	"github.com/ory/fosite/handler/openid"
	"github.com/pixlcrashr/vsfv/pkg/cfg"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// Server holds the fosite OAuth2 provider and related dependencies.
type Server struct {
	oauth2     fosite.OAuth2Provider
	storage    *Storage
	sessionMgr *SessionManager
	userRepo   *repository.UserRepository
	cfg        cfg.Auth
	publicURL  string
	keyManager *KeyManager
}

func NewServer(
	db *gorm.DB,
	authCfg cfg.Auth,
	publicURL string,
	userRepo *repository.UserRepository,
	clientRepo *repository.OAuth2ClientRepository,
	tokenRepo *repository.OAuth2TokenRepository,
	sessionRepo *repository.AuthSessionRepository,
) (*Server, error) {
	km, err := LoadKeys(authCfg.JWKS)
	if err != nil {
		return nil, err
	}

	storage := NewStorage(db, clientRepo, tokenRepo, userRepo)
	sessionMgr := NewSessionManager(sessionRepo, authCfg.SessionTTL)

	secret := []byte(authCfg.Secret)

	fositeConfig := &fosite.Config{
		AccessTokenLifespan:        authCfg.TokenTTL,
		RefreshTokenLifespan:       authCfg.RefreshTTL,
		GlobalSecret:               secret,
		IDTokenIssuer:              publicURL,
		AccessTokenIssuer:          publicURL,
		SendDebugMessagesToClients: true,
	}

	oauth2 := compose.ComposeAllEnabled(fositeConfig, storage, km.SigningKey())

	return &Server{
		oauth2:     oauth2,
		storage:    storage,
		sessionMgr: sessionMgr,
		userRepo:   userRepo,
		cfg:        authCfg,
		publicURL:  publicURL,
		keyManager: km,
	}, nil
}

func (s *Server) KeyManager() *KeyManager         { return s.keyManager }
func (s *Server) Config() cfg.Auth                { return s.cfg }
func (s *Server) PublicURL() string               { return s.publicURL }
func (s *Server) SessionManager() *SessionManager { return s.sessionMgr }
func (s *Server) OAuth2() fosite.OAuth2Provider   { return s.oauth2 }

// --- Authorize endpoint ---

func (s *Server) AuthorizeHandler(c *fiber.Ctx) error {
	return adaptor.HTTPHandler(http.HandlerFunc(s.authorizeHandler))(c)
}

func (s *Server) authorizeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	ar, err := s.oauth2.NewAuthorizeRequest(ctx, r)
	if err != nil {
		s.oauth2.WriteAuthorizeError(ctx, w, ar, err)
		return
	}

	sess, err := s.sessionMgr.GetSessionFromRequest(ctx, r)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":             "unauthorized",
			"error_description": "no valid session",
		})
		return
	}

	user, err := s.userRepo.GetByID(ctx, sess.UserID)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"error":             "unauthorized",
			"error_description": "user not found",
		})
		return
	}

	session := NewSession(user)

	for _, scope := range ar.GetRequestedScopes() {
		ar.GrantScope(scope)
	}

	response, err := s.oauth2.NewAuthorizeResponse(ctx, ar, session)
	if err != nil {
		s.oauth2.WriteAuthorizeError(ctx, w, ar, err)
		return
	}

	s.oauth2.WriteAuthorizeResponse(ctx, w, ar, response)
}

// --- Token endpoint ---

func (s *Server) TokenHandler(c *fiber.Ctx) error {
	return adaptor.HTTPHandler(http.HandlerFunc(s.tokenHandler))(c)
}

func (s *Server) tokenHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	session := NewSession(nil)

	accessRequest, err := s.oauth2.NewAccessRequest(ctx, r, session)
	if err != nil {
		s.oauth2.WriteAccessError(ctx, w, accessRequest, err)
		return
	}

	response, err := s.oauth2.NewAccessResponse(ctx, accessRequest)
	if err != nil {
		s.oauth2.WriteAccessError(ctx, w, accessRequest, err)
		return
	}

	s.oauth2.WriteAccessResponse(ctx, w, accessRequest, response)
}

// --- Revocation endpoint ---

func (s *Server) RevokeHandler(c *fiber.Ctx) error {
	return adaptor.HTTPHandler(http.HandlerFunc(s.revokeHandler))(c)
}

func (s *Server) revokeHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	err := s.oauth2.NewRevocationRequest(ctx, r)
	s.oauth2.WriteRevocationResponse(ctx, w, err)
}

// --- Introspection endpoint ---

func (s *Server) IntrospectHandler(c *fiber.Ctx) error {
	return adaptor.HTTPHandler(http.HandlerFunc(s.introspectHandler))(c)
}

func (s *Server) introspectHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	session := NewSession(nil)
	ir, err := s.oauth2.NewIntrospectionRequest(ctx, r, session)
	if err != nil {
		s.oauth2.WriteIntrospectionError(ctx, w, err)
		return
	}
	s.oauth2.WriteIntrospectionResponse(ctx, w, ir)
}

// --- UserInfo endpoint ---

func (s *Server) UserInfoHandler(c *fiber.Ctx) error {
	return adaptor.HTTPHandler(http.HandlerFunc(s.userInfoHandler))(c)
}

func (s *Server) userInfoHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	token := getBearerToken(r)
	if token == "" {
		writeJSONError(w, http.StatusUnauthorized, "invalid_token", "no bearer token")
		return
	}

	session := NewSession(nil)
	_, accessRequest, err := s.oauth2.IntrospectToken(ctx, token, fosite.AccessToken, session)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_token", "token validation failed")
		return
	}

	userID := accessRequest.GetSession().GetSubject()
	if userID == "" {
		writeJSONError(w, http.StatusUnauthorized, "invalid_token", "no subject")
		return
	}

	uid, err := uuid.Parse(userID)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_token", "invalid subject")
		return
	}

	user, err := s.userRepo.GetByID(ctx, uid)
	if err != nil {
		writeJSONError(w, http.StatusUnauthorized, "invalid_token", "user not found")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"sub":     user.ID.String(),
		"email":   user.Email,
		"name":    user.Name,
		"picture": derefString(user.Picture),
	})
}

// --- JWKS endpoint ---

func (s *Server) JWKSHandler(c *fiber.Ctx) error {
	jwks := s.keyManager.PublicJWKS()
	data, err := json.Marshal(jwks)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "internal_error"})
	}
	c.Set("Content-Type", "application/json")
	return c.Send(data)
}

// --- Session / User helpers ---

func NewSession(user *model.User) fosite.Session {
	s := openid.NewDefaultSession()
	if user != nil {
		s.Subject = user.ID.String()
		s.Username = user.Email
		s.Claims.Subject = user.ID.String()
		s.Claims.Extra = map[string]interface{}{
			"email":   user.Email,
			"name":    user.Name,
			"picture": derefString(user.Picture),
		}
	}
	return s
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func getBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	parts := strings.SplitN(auth, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}

func writeJSONError(w http.ResponseWriter, status int, errCode, desc string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{
		"error":             errCode,
		"error_description": desc,
	})
}
