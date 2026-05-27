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

	// List nested accounts: GET /accounts/nested
	huma.Register(api, huma.Operation{
		OperationID: "list-accounts-nested",
		Method:      http.MethodGet,
		Path:        "/v1/accounts/nested",
		Summary:     "List all accounts in nested form",
		Description: "Returns all accounts organized in a nested tree structure with their children.",
		Tags:        []string{"Accounts"},
	}, h.ListNestedAccount)

	// Get nested account: GET /accounts/{accountId}/nested
	huma.Register(api, huma.Operation{
		OperationID: "get-nested-account",
		Method:      http.MethodGet,
		Path:        "/v1/accounts/{accountId}/nested",
		Summary:     "Get account with nested children",
		Description: "Gets a single budget account with its entire nested subtree of children.",
		Tags:        []string{"Accounts"},
	}, h.GetNestedAccount)

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

	// Archive account: POST /accounts/{accountId}/archive
	huma.Register(api, huma.Operation{
		OperationID: "archive-account",
		Method:      http.MethodPost,
		Path:        "/v1/accounts/{accountId}/archive",
		Summary:     "Archive an account",
		Description: "Archives a budget account.",
		Tags:        []string{"Accounts"},
	}, h.ArchiveAccount)

	// Update account: PATCH /accounts/{accountId}
	huma.Register(api, huma.Operation{
		OperationID: "update-account",
		Method:      http.MethodPatch,
		Path:        "/v1/accounts/{accountId}",
		Summary:     "Update an account",
		Description: "Updates an existing budget account.",
		Tags:        []string{"Accounts"},
	}, h.UpdateAccount)

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
