package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/cfg"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"golang.org/x/oauth2"
)

const (
	gitlabProviderName = "gitlab"
)

type GitLabHandler struct {
	cfg          cfgGitLab
	userRepo     *repository.UserRepository
	identityRepo *repository.UserIdentityRepository
	sessionMgr   *SessionManager
	oauth2Config *oauth2.Config
}

type cfgGitLab interface {
	IsEnabled() bool
	GetClientID() string
	GetClientSecret() string
	GetIssuer() string
}

type gitlabConfigAdapter struct {
	enabled      bool
	clientID     string
	clientSecret string
	issuer       string
}

func (g gitlabConfigAdapter) IsEnabled() bool         { return g.enabled }
func (g gitlabConfigAdapter) GetClientID() string     { return g.clientID }
func (g gitlabConfigAdapter) GetClientSecret() string { return g.clientSecret }
func (g gitlabConfigAdapter) GetIssuer() string       { return g.issuer }

func NewGitLabHandler(
	authCfg cfg.Auth,
	userRepo *repository.UserRepository,
	identityRepo *repository.UserIdentityRepository,
	sessionMgr *SessionManager,
) *GitLabHandler {
	adapter := gitlabConfigAdapter{
		enabled:      authCfg.GitLab.Enabled,
		clientID:     authCfg.GitLab.ClientID,
		clientSecret: authCfg.GitLab.ClientSecret,
		issuer:       authCfg.GitLab.Issuer,
	}

	g := &GitLabHandler{
		cfg:          adapter,
		userRepo:     userRepo,
		identityRepo: identityRepo,
		sessionMgr:   sessionMgr,
	}

	if adapter.IsEnabled() {
		issuer := strings.TrimSuffix(adapter.GetIssuer(), "/")
		g.oauth2Config = &oauth2.Config{
			ClientID:     adapter.GetClientID(),
			ClientSecret: adapter.GetClientSecret(),
			RedirectURL:  "", // set per-request via state
			Endpoint: oauth2.Endpoint{
				AuthURL:  issuer + "/oauth/authorize",
				TokenURL: issuer + "/oauth/token",
			},
			Scopes: []string{"openid", "profile", "email"},
		}
	}

	return g
}

func (g *GitLabHandler) IsEnabled() bool {
	return g.cfg.IsEnabled()
}

// GitLabLoginInitiate redirects the user to GitLab for OIDC login.
func (g *GitLabHandler) GitLabLoginInitiate(c *fiber.Ctx) error {
	if !g.cfg.IsEnabled() {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "gitlab login disabled"})
	}

	redirectURI := c.Query("redirect_uri")
	if redirectURI == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request", "error_description": "redirect_uri is required"})
	}

	// Build a state that encodes the redirect URI
	state := fmt.Sprintf("%s|%s", uuid.New().String(), redirectURI)

	url := g.oauth2Config.AuthCodeURL(state, oauth2.SetAuthURLParam("redirect_uri", redirectURI))
	return c.Redirect(url, http.StatusTemporaryRedirect)
}

// GitLabLoginCallback handles the callback from GitLab.
func (g *GitLabHandler) GitLabLoginCallback(c *fiber.Ctx) error {
	if !g.cfg.IsEnabled() {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "gitlab login disabled"})
	}

	code := c.Query("code")
	if code == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request", "error_description": "no code provided"})
	}

	state := c.Query("state")
	if state == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request", "error_description": "no state provided"})
	}

	// Parse state to extract redirect URI
	parts := strings.SplitN(state, "|", 2)
	if len(parts) != 2 {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request", "error_description": "invalid state"})
	}
	redirectURI := parts[1]

	ctx := c.Context()

	// Exchange code for token using the redirect URI that was used for the initial request
	token, err := g.oauth2Config.Exchange(ctx, code, oauth2.SetAuthURLParam("redirect_uri", redirectURI))
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "token_exchange_failed", "error_description": err.Error()})
	}

	// Fetch userinfo from GitLab
	userInfo, err := g.fetchGitLabUserInfo(ctx, token.AccessToken)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "userinfo_failed", "error_description": err.Error()})
	}

	// Find or create user
	user, err := g.findOrCreateUser(ctx, userInfo)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "user_provisioning_failed", "error_description": err.Error()})
	}

	// Create session
	sess, err := g.sessionMgr.CreateSession(ctx, user.ID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "session_failed", "error_description": err.Error()})
	}

	// Redirect back to the redirect URI with session token
	// The SPA will use this to set the cookie or we set it directly
	separator := "?"
	if strings.Contains(redirectURI, "?") {
		separator = "&"
	}
	redirectURL := fmt.Sprintf("%s%ssession_token=%s", redirectURI, separator, sess.Token)
	return c.Redirect(redirectURL, http.StatusTemporaryRedirect)
}

type gitlabUserInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	Name          string `json:"name"`
	Username      string `json:"nickname"`
	Picture       string `json:"picture"`
	EmailVerified bool   `json:"email_verified"`
}

func (g *GitLabHandler) fetchGitLabUserInfo(ctx context.Context, accessToken string) (*gitlabUserInfo, error) {
	issuer := strings.TrimSuffix(g.cfg.GetIssuer(), "/")
	req, err := http.NewRequestWithContext(ctx, "GET", issuer+"/oauth/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("creating userinfo request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetching userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("userinfo returned status %d: %s", resp.StatusCode, string(body))
	}

	var info gitlabUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("decoding userinfo: %w", err)
	}

	return &info, nil
}

func (g *GitLabHandler) findOrCreateUser(ctx context.Context, info *gitlabUserInfo) (*model.User, error) {
	// Try to find existing identity
	identity, err := g.identityRepo.GetByProvider(ctx, gitlabProviderName, info.Sub)
	if err == nil {
		// Existing user found
		return g.userRepo.GetByID(ctx, identity.UserID)
	}

	// Check if a user with the same email already exists
	user, err := g.userRepo.GetByEmail(ctx, info.Email)
	if err != nil {
		// User doesn't exist, create one
		var picture *string
		if info.Picture != "" {
			picture = &info.Picture
		}
		user, err = g.userRepo.CreateWithPassword(ctx, repository.CreateUserWithPasswordParams{
			Email:   info.Email,
			Name:    info.Name,
			Picture: picture,
		})
		if err != nil {
			return nil, fmt.Errorf("creating user: %w", err)
		}
	}

	// Create the identity link
	identity = &model.UserIdentity{
		CustomID:       info.Username,
		UserID:         user.ID,
		Provider:       gitlabProviderName,
		ProviderUserID: info.Sub,
	}
	if err := g.identityRepo.Create(ctx, identity); err != nil {
		return nil, fmt.Errorf("creating user identity: %w", err)
	}

	return user, nil
}
