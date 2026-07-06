package auth

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/lib/pq"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
)

const DefaultWebClientID = "web-app"

// SeedDefaultClient creates the default web client if it doesn't already exist.
// The redirect URI is derived from the public URL as {publicURL}/callback.
func SeedDefaultClient(ctx context.Context, repo *repository.OAuth2ClientRepository, publicURL string) error {
	_, err := repo.GetByClientID(ctx, DefaultWebClientID)
	if err == nil {
		return nil // already exists
	}

	redirectURI := strings.TrimSuffix(publicURL, "/") + "/callback"

	log.Printf("Seeding default OAuth2 client %q with redirect URI %q", DefaultWebClientID, redirectURI)

	_, err = repo.Create(ctx, repository.CreateOAuth2ClientParams{
		ClientID:      DefaultWebClientID,
		ClientName:    "Web",
		RedirectURIs:  pq.StringArray{redirectURI},
		GrantTypes:    pq.StringArray{"authorization_code", "refresh_token"},
		ResponseTypes: pq.StringArray{"code", "code id_token"},
		Scopes:        pq.StringArray(append([]string{"openid", "profile", "email", "offline"}, authz.AllAPIScopes...)),
		Public:        true,
	})
	if err != nil {
		return fmt.Errorf("seeding default client: %w", err)
	}
	return nil
}
