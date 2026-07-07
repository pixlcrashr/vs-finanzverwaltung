package auth

import (
	"encoding/json"
	"net/http"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}

func (s *Server) LoginHandler(c *fiber.Ctx) error {
	if !s.cfg.PasswordLogin.Enabled {
		return c.Status(http.StatusNotFound).JSON(fiber.Map{"error": "password login disabled"})
	}

	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request", "error_description": "cannot parse request body"})
	}

	if req.Login == "" || req.Password == "" {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request", "error_description": "login and password are required"})
	}

	// Try email first, then name
	user, err := s.userRepo.GetByEmail(c.Context(), req.Login)
	if err != nil {
		user, err = s.userRepo.GetByName(c.Context(), req.Login, true)
		if err != nil {
			return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid_credentials", "error_description": "invalid login or password"})
		}
	}

	if user.PasswordHash == nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid_credentials", "error_description": "password login not configured for this user"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "invalid_credentials", "error_description": "invalid login or password"})
	}

	sess, err := s.sessionMgr.CreateSession(c.Context(), user.ID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": "internal_error", "error_description": "failed to create session"})
	}

	// Set session cookie via http.ResponseWriter for consistency with SessionManager
	setCookieAdapter := adaptor.HTTPHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		s.sessionMgr.SetSessionCookie(w, sess.Token)
		w.WriteHeader(http.StatusOK)
		_ = writeJSONBody(w, fiber.Map{"status": "ok"})
	}))
	return setCookieAdapter(c)
}

func (s *Server) LogoutHandler(c *fiber.Ctx) error {
	cookie := c.Cookies(SessionCookieName)
	if cookie != "" {
		_ = s.sessionMgr.DeleteSession(c.Context(), cookie)
	}

	clearCookieAdapter := adaptor.HTTPHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		s.sessionMgr.ClearSessionCookie(w)
		w.WriteHeader(http.StatusOK)
		_ = writeJSONBody(w, fiber.Map{"status": "ok"})
	}))
	return clearCookieAdapter(c)
}

func (s *Server) MeHandler(c *fiber.Ctx) error {
	cookie := c.Cookies(SessionCookieName)
	if cookie == "" {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized", "error_description": "no session"})
	}

	sess, err := s.sessionMgr.GetSession(c.Context(), cookie)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized", "error_description": "invalid or expired session"})
	}

	user, err := s.userRepo.GetByID(c.Context(), sess.UserID)
	if err != nil {
		return c.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "unauthorized", "error_description": "user not found"})
	}

	return c.JSON(fiber.Map{
		"id":      user.ID.String(),
		"email":   user.Email,
		"name":    user.Name,
		"picture": derefString(user.Picture),
	})
}

// HashPassword is a utility for creating password hashes for users.
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// CreateUserWithPassword creates a user with a bcrypt-hashed password.
func (s *Server) CreateUserWithPassword(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Name     string `json:"name"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "invalid_request"})
	}

	user, err := s.userRepo.CreateWithPassword(c.Context(), repository.CreateUserWithPasswordParams{
		Email:    req.Email,
		Name:     req.Name,
		Password: req.Password,
	})
	if err != nil {
		return c.Status(http.StatusConflict).JSON(fiber.Map{"error": "user_exists", "error_description": err.Error()})
	}

	return c.Status(http.StatusCreated).JSON(fiber.Map{
		"id":    user.ID.String(),
		"email": user.Email,
		"name":  user.Name,
	})
}

// writeJSONBody writes a JSON body to an http.ResponseWriter.
func writeJSONBody(w http.ResponseWriter, v interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(v)
}

// Ensure repository import is used
var _ = repository.ErrUserNotFound
