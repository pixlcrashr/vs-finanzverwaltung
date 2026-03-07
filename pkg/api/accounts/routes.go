package accounts

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers all account-related routes following Google AIP patterns.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewAccountRepository(db))

	// List accounts: GET /accounts
	huma.Register(api, huma.Operation{
		OperationID: "list-accounts",
		Method:      http.MethodGet,
		Path:        "/v1/accounts",
		Summary:     "List accounts",
		Description: "Lists all budget accounts with pagination support.",
		Tags:        []string{"Accounts"},
	}, h.ListAccounts)

	// Get account: GET /accounts/{accountId}
	huma.Register(api, huma.Operation{
		OperationID: "get-account",
		Method:      http.MethodGet,
		Path:        "/v1/accounts/{accountId}",
		Summary:     "Get an account",
		Description: "Gets a single budget account by ID.",
		Tags:        []string{"Accounts"},
	}, h.GetAccount)

	// Create account: POST /accounts
	huma.Register(api, huma.Operation{
		OperationID: "create-account",
		Method:      http.MethodPost,
		Path:        "/v1/accounts",
		Summary:     "Create an account",
		Description: "Creates a new budget account.",
		Tags:        []string{"Accounts"},
	}, h.CreateAccount)

	// Update account: PATCH /accounts/{accountId}
	huma.Register(api, huma.Operation{
		OperationID: "update-account",
		Method:      http.MethodPatch,
		Path:        "/v1/accounts/{accountId}",
		Summary:     "Update an account",
		Description: "Updates an existing budget account.",
		Tags:        []string{"Accounts"},
	}, h.UpdateAccount)

	// Archive account: POST /accounts/{accountId}:archive
	huma.Register(api, huma.Operation{
		OperationID: "archive-account",
		Method:      http.MethodPost,
		Path:        "/v1/accounts/{accountId}:archive",
		Summary:     "Archive an account",
		Description: "Archives a budget account.",
		Tags:        []string{"Accounts"},
	}, h.ArchiveAccount)

	// Delete account: DELETE /accounts/{accountId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-account",
		Method:      http.MethodDelete,
		Path:        "/v1/accounts/{accountId}",
		Summary:     "Delete an account",
		Description: "Deletes a budget account.",
		Tags:        []string{"Accounts"},
	}, h.DeleteAccount)
}
