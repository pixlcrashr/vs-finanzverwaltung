package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/url"
	"time"

	"github.com/go-jose/go-jose/v3"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/ory/fosite"
	"github.com/ory/fosite/handler/openid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// Storage implements the fosite.Storage interface and all sub-interfaces
// required by compose.ComposeAllEnabled:
//   - fosite.ClientManager
//   - oauth2.AccessTokenStorage
//   - oauth2.RefreshTokenStorage
//   - oauth2.AuthorizeCodeStorage
//   - oauth2.PKCERequestStorage
//   - openid.OpenIDConnectRequestStorage
//   - oauth2.TokenRevocationStorage
//   - storage.Transactional (optional)
//   - jwt.JWTStrategy (for client assertion JTI tracking)

const (
	requestTypeAccessToken   = "access_token"
	requestTypeRefreshToken  = "refresh_token"
	requestTypeAuthorizeCode = "authorize_code"
	requestTypeOIDCSession   = "oidc_session"
	requestTypePKCERequest   = "pkce_request"
)

type Storage struct {
	db         *gorm.DB
	clientRepo *repository.OAuth2ClientRepository
	tokenRepo  *repository.OAuth2TokenRepository
	userRepo   *repository.UserRepository
	q          *dao.Query
}

func NewStorage(db *gorm.DB, clientRepo *repository.OAuth2ClientRepository, tokenRepo *repository.OAuth2TokenRepository, userRepo *repository.UserRepository) *Storage {
	return &Storage{
		db:         db,
		clientRepo: clientRepo,
		tokenRepo:  tokenRepo,
		userRepo:   userRepo,
		q:          dao.Use(db),
	}
}

// --- ClientManager ---

func (s *Storage) GetClient(ctx context.Context, id string) (fosite.Client, error) {
	c, err := s.clientRepo.GetByClientID(ctx, id)
	if err != nil {
		return nil, err
	}
	return toFositeClient(c), nil
}

// --- fosite.Client implementation ---

type fositeClient struct {
	id                      string
	name                    string
	secret                  string
	redirectURIs            []string
	grantTypes              []string
	responseTypes           []string
	scopes                  []string
	public                  bool
	tokenEndpointAuthMethod string
}

func (c *fositeClient) GetID() string                      { return c.id }
func (c *fositeClient) GetName() string                    { return c.name }
func (c *fositeClient) GetSecret() []byte                  { return []byte(c.secret) }
func (c *fositeClient) GetHashedSecret() []byte            { return []byte(c.secret) }
func (c *fositeClient) GetRedirectURIs() []string          { return c.redirectURIs }
func (c *fositeClient) GetGrantTypes() fosite.Arguments    { return c.grantTypes }
func (c *fositeClient) GetResponseTypes() fosite.Arguments { return c.responseTypes }
func (c *fositeClient) GetScopes() fosite.Arguments        { return c.scopes }
func (c *fositeClient) IsPublic() bool                     { return c.public }
func (c *fositeClient) GetTokenEndpointAuthMethod() string { return c.tokenEndpointAuthMethod }
func (c *fositeClient) GetAudience() fosite.Arguments      { return nil }

func toFositeClient(m *model.OAuth2Client) *fositeClient {
	secret := ""
	if m.ClientSecret != nil {
		secret = *m.ClientSecret
	}
	return &fositeClient{
		id:                      m.ClientID,
		name:                    m.ClientName,
		secret:                  secret,
		redirectURIs:            m.RedirectURIs,
		grantTypes:              m.GrantTypes,
		responseTypes:           m.ResponseTypes,
		scopes:                  m.Scopes,
		public:                  m.Public,
		tokenEndpointAuthMethod: m.TokenEndpointAuthMethod,
	}
}

// --- Helper: serialize/deserialize fosite.Requester ---

type storedRequest struct {
	ID             string          `json:"id"`
	RequestedAt    time.Time       `json:"requested_at"`
	ClientID       string          `json:"client_id"`
	RequestedScope []string        `json:"requested_scope"`
	GrantedScope   []string        `json:"granted_scope"`
	FormData       string          `json:"form_data"`
	SessionData    json.RawMessage `json:"session_data"`
}

func serializeRequester(req fosite.Requester) (formData string, sessionData string, err error) {
	form := req.GetRequestForm()
	if form != nil {
		formData = form.Encode()
	}

	session := req.GetSession()
	if session != nil {
		data, err := json.Marshal(session)
		if err != nil {
			return "", "", fmt.Errorf("marshal session: %w", err)
		}
		sessionData = string(data)
	}

	return formData, sessionData, nil
}

func deserializeRequester(s *Storage, m *model.OAuth2Token, session fosite.Session) (fosite.Requester, error) {
	form, err := url.ParseQuery(m.FormData)
	if err != nil {
		return nil, fmt.Errorf("parse form data: %w", err)
	}

	if session != nil && len(m.SessionData) > 0 {
		if err := json.Unmarshal([]byte(m.SessionData), session); err != nil {
			return nil, fmt.Errorf("unmarshal session: %w", err)
		}
	}

	client, err := s.GetClient(context.Background(), m.ClientID)
	if err != nil {
		return nil, err
	}

	return &fosite.Request{
		ID:             m.Signature,
		RequestedAt:    m.RequestedAt,
		Client:         client,
		RequestedScope: fosite.Arguments(m.Scope),
		GrantedScope:   fosite.Arguments(m.GrantedScope),
		Form:           form,
		Session:        session,
	}, nil
}

// --- AccessTokenStorage ---

func (s *Storage) CreateAccessTokenSession(ctx context.Context, signature string, req fosite.Requester) error {
	formData, sessionData, err := serializeRequester(req)
	if err != nil {
		return err
	}

	var userID *uuid.UUID
	if subj := req.GetSession().GetSubject(); subj != "" {
		if id, err := uuid.Parse(subj); err == nil {
			userID = &id
		}
	}

	_, err = s.tokenRepo.Create(ctx, repository.CreateOAuth2TokenParams{
		Signature:    signature,
		RequestType:  requestTypeAccessToken,
		ClientID:     req.GetClient().GetID(),
		UserID:       userID,
		Scope:        pq.StringArray(req.GetRequestedScopes()),
		GrantedScope: pq.StringArray(req.GetGrantedScopes()),
		FormData:     formData,
		SessionData:  sessionData,
	})
	return err
}

func (s *Storage) GetAccessTokenSession(ctx context.Context, signature string, session fosite.Session) (fosite.Requester, error) {
	m, err := s.tokenRepo.GetBySignature(ctx, signature, requestTypeAccessToken)
	if err != nil {
		if errors.Is(err, repository.ErrOAuth2TokenNotFound) {
			return nil, fosite.ErrNotFound.WithDebug(err.Error())
		}
		return nil, err
	}
	return deserializeRequester(s, m, session)
}

func (s *Storage) DeleteAccessTokenSession(ctx context.Context, signature string) error {
	return s.tokenRepo.DeleteBySignature(ctx, signature, requestTypeAccessToken)
}

// --- RefreshTokenStorage ---

func (s *Storage) CreateRefreshTokenSession(ctx context.Context, signature string, accessSignature string, req fosite.Requester) error {
	formData, sessionData, err := serializeRequester(req)
	if err != nil {
		return err
	}

	var userID *uuid.UUID
	if subj := req.GetSession().GetSubject(); subj != "" {
		if id, err := uuid.Parse(subj); err == nil {
			userID = &id
		}
	}

	_, err = s.tokenRepo.Create(ctx, repository.CreateOAuth2TokenParams{
		Signature:    signature,
		RequestType:  requestTypeRefreshToken,
		ClientID:     req.GetClient().GetID(),
		UserID:       userID,
		Scope:        pq.StringArray(req.GetRequestedScopes()),
		GrantedScope: pq.StringArray(req.GetGrantedScopes()),
		FormData:     formData,
		SessionData:  sessionData,
	})
	return err
}

func (s *Storage) GetRefreshTokenSession(ctx context.Context, signature string, session fosite.Session) (fosite.Requester, error) {
	m, err := s.tokenRepo.GetBySignature(ctx, signature, requestTypeRefreshToken)
	if err != nil {
		if errors.Is(err, repository.ErrOAuth2TokenNotFound) {
			return nil, fosite.ErrNotFound.WithDebug(err.Error())
		}
		return nil, err
	}
	return deserializeRequester(s, m, session)
}

func (s *Storage) DeleteRefreshTokenSession(ctx context.Context, signature string) error {
	return s.tokenRepo.DeleteBySignature(ctx, signature, requestTypeRefreshToken)
}

// --- AuthorizeCodeStorage ---

func (s *Storage) CreateAuthorizeCodeSession(ctx context.Context, code string, req fosite.Requester) error {
	formData, sessionData, err := serializeRequester(req)
	if err != nil {
		return err
	}

	var userID *uuid.UUID
	if subj := req.GetSession().GetSubject(); subj != "" {
		if id, err := uuid.Parse(subj); err == nil {
			userID = &id
		}
	}

	_, err = s.tokenRepo.Create(ctx, repository.CreateOAuth2TokenParams{
		Signature:    code,
		RequestType:  requestTypeAuthorizeCode,
		ClientID:     req.GetClient().GetID(),
		UserID:       userID,
		Scope:        pq.StringArray(req.GetRequestedScopes()),
		GrantedScope: pq.StringArray(req.GetGrantedScopes()),
		FormData:     formData,
		SessionData:  sessionData,
	})
	return err
}

func (s *Storage) GetAuthorizeCodeSession(ctx context.Context, code string, session fosite.Session) (fosite.Requester, error) {
	m, err := s.tokenRepo.GetBySignature(ctx, code, requestTypeAuthorizeCode)
	if err != nil {
		if errors.Is(err, repository.ErrOAuth2TokenNotFound) {
			return nil, fosite.ErrNotFound.WithDebug(err.Error())
		}
		return nil, err
	}
	return deserializeRequester(s, m, session)
}

func (s *Storage) InvalidateAuthorizeCodeSession(ctx context.Context, code string) error {
	return s.tokenRepo.DeleteBySignature(ctx, code, requestTypeAuthorizeCode)
}

// --- PKCERequestStorage ---

func (s *Storage) CreatePKCERequestSession(ctx context.Context, code string, req fosite.Requester) error {
	formData, sessionData, err := serializeRequester(req)
	if err != nil {
		return err
	}

	_, err = s.tokenRepo.Create(ctx, repository.CreateOAuth2TokenParams{
		Signature:    code,
		RequestType:  requestTypePKCERequest,
		ClientID:     req.GetClient().GetID(),
		Scope:        pq.StringArray(req.GetRequestedScopes()),
		GrantedScope: pq.StringArray(req.GetGrantedScopes()),
		FormData:     formData,
		SessionData:  sessionData,
	})
	return err
}

func (s *Storage) GetPKCERequestSession(ctx context.Context, code string, session fosite.Session) (fosite.Requester, error) {
	m, err := s.tokenRepo.GetBySignature(ctx, code, requestTypePKCERequest)
	if err != nil {
		if errors.Is(err, repository.ErrOAuth2TokenNotFound) {
			return nil, fosite.ErrNotFound.WithDebug(err.Error())
		}
		return nil, err
	}
	return deserializeRequester(s, m, session)
}

func (s *Storage) DeletePKCERequestSession(ctx context.Context, code string) error {
	return s.tokenRepo.DeleteBySignature(ctx, code, requestTypePKCERequest)
}

// --- OpenIDConnectRequestStorage ---

func (s *Storage) CreateOpenIDConnectSession(ctx context.Context, authorizeCode string, req fosite.Requester) error {
	formData, sessionData, err := serializeRequester(req)
	if err != nil {
		return err
	}

	_, err = s.tokenRepo.Create(ctx, repository.CreateOAuth2TokenParams{
		Signature:    authorizeCode,
		RequestType:  requestTypeOIDCSession,
		ClientID:     req.GetClient().GetID(),
		Scope:        pq.StringArray(req.GetRequestedScopes()),
		GrantedScope: pq.StringArray(req.GetGrantedScopes()),
		FormData:     formData,
		SessionData:  sessionData,
	})
	return err
}

func (s *Storage) GetOpenIDConnectSession(ctx context.Context, authorizeCode string, req fosite.Requester) (fosite.Requester, error) {
	m, err := s.tokenRepo.GetBySignature(ctx, authorizeCode, requestTypeOIDCSession)
	if err != nil {
		if errors.Is(err, repository.ErrOAuth2TokenNotFound) {
			return nil, fosite.ErrNotFound.WithDebug(err.Error())
		}
		return nil, err
	}
	return deserializeRequester(s, m, req.GetSession())
}

func (s *Storage) DeleteOpenIDConnectSession(ctx context.Context, authorizeCode string) error {
	return s.tokenRepo.DeleteBySignature(ctx, authorizeCode, requestTypeOIDCSession)
}

// --- TokenRevocationStorage ---

func (s *Storage) RevokeAccessToken(ctx context.Context, requestID string) error {
	return s.tokenRepo.DeleteBySignature(ctx, requestID, requestTypeAccessToken)
}

func (s *Storage) RevokeRefreshToken(ctx context.Context, requestID string) error {
	return s.tokenRepo.DeleteBySignature(ctx, requestID, requestTypeRefreshToken)
}

func (s *Storage) RotateRefreshToken(ctx context.Context, requestID string, refreshTokenSignature string) error {
	// Delete the old refresh token session
	if err := s.tokenRepo.DeleteBySignature(ctx, requestID, requestTypeRefreshToken); err != nil {
		return fmt.Errorf("rotate refresh token: delete old: %w", err)
	}
	_ = refreshTokenSignature // new session is created by fosite calling CreateRefreshTokenSession
	return nil
}

// --- Client assertion JWT tracking (for fosite.ClientAssertionJWTStorage) ---

func (s *Storage) ClientAssertionJWTValid(ctx context.Context, jti string) error {
	// We don't track JTI usage for now; accept all.
	return nil
}

func (s *Storage) SetClientAssertionJWT(ctx context.Context, jti string, exp time.Time) error {
	// No-op: we don't track JTI usage.
	return nil
}

// --- OpenIDConnectRequestStorage additional methods ---

// The openid.OpenIDConnectRequestStorage interface is satisfied by
// CreateOpenIDConnectSession, GetOpenIDConnectSession, DeleteOpenIDConnectSession above.

// --- PublicKeyStorage (for JWT grant type) ---

func (s *Storage) GetPublicKey(ctx context.Context, issuer string, subject string, keyId string) (*jose.JSONWebKey, error) {
	return nil, fmt.Errorf("GetPublicKey not supported")
}

func (s *Storage) GetPublicKeys(ctx context.Context, issuer string, subject string) (*jose.JSONWebKeySet, error) {
	return nil, fmt.Errorf("GetPublicKeys not supported")
}

func (s *Storage) GetPublicKeyScopes(ctx context.Context, issuer string, subject string, keyId string) ([]string, error) {
	return nil, fmt.Errorf("GetPublicKeyScopes not supported")
}

// --- JWT tracking (for fosite.JWTStrategy storage) ---

func (s *Storage) IsJWTUsed(ctx context.Context, jti string) (bool, error) {
	return false, nil
}

func (s *Storage) MarkJWTUsedForTime(ctx context.Context, jti string, exp time.Time) error {
	return nil
}

// --- Authenticate (for Resource Owner Password Credentials) ---

func (s *Storage) Authenticate(ctx context.Context, name string, secret string) (subject string, err error) {
	user, err := s.userRepo.GetByEmail(ctx, name)
	if err != nil {
		user, err = s.userRepo.GetByName(ctx, name, true)
		if err != nil {
			return "", fosite.ErrNotFound.WithDebug("user not found")
		}
	}

	if user.PasswordHash == nil {
		return "", fosite.ErrNotFound.WithDebug("password login not configured for this user")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(secret)); err != nil {
		return "", fosite.ErrNotFound.WithDebug("invalid credentials")
	}

	return user.ID.String(), nil
}

// --- OpenID user info ---

// Ensure openid package is referenced for interface compliance.
var _ openid.OpenIDConnectRequestStorage = (*Storage)(nil)
