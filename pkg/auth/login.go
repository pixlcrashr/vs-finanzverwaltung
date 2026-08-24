package auth

import (
	"encoding/json"
	"net/http"

	"github.com/gofiber/adaptor/v2"
	"github.com/gofiber/fiber/v2"
)

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
		"id":          user.ID.String(),
		"email":       user.Email,
		"name":        user.Name,
		"picture":     user.PictureURL.String,
		"picture_url": user.PictureURL.String,
	})
}

// writeJSONBody writes a JSON body to an http.ResponseWriter.
func writeJSONBody(w http.ResponseWriter, v interface{}) error {
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(v)
}
