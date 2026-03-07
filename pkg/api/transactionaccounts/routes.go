package transactionaccounts

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers transaction account routes.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewTransactionAccountRepository(db))

	// List transaction accounts: GET /transactionAccounts
	huma.Register(api, huma.Operation{
		OperationID: "list-transaction-accounts",
		Method:      http.MethodGet,
		Path:        "/v1/transactionAccounts",
		Summary:     "List transaction accounts",
		Description: "Lists all transaction accounts (external accounts from imports).",
		Tags:        []string{"Transaction Accounts"},
	}, h.ListTransactionAccounts)

	// Get transaction account: GET /transactionAccounts/{transactionAccountId}
	huma.Register(api, huma.Operation{
		OperationID: "get-transaction-account",
		Method:      http.MethodGet,
		Path:        "/v1/transactionAccounts/{transactionAccountId}",
		Summary:     "Get a transaction account",
		Description: "Gets a single transaction account by ID.",
		Tags:        []string{"Transaction Accounts"},
	}, h.GetTransactionAccount)

	// Create transaction account: POST /transactionAccounts
	huma.Register(api, huma.Operation{
		OperationID: "create-transaction-account",
		Method:      http.MethodPost,
		Path:        "/v1/transactionAccounts",
		Summary:     "Create a transaction account",
		Description: "Creates a new transaction account.",
		Tags:        []string{"Transaction Accounts"},
	}, h.CreateTransactionAccount)

	// Update transaction account: PATCH /transactionAccounts/{transactionAccountId}
	huma.Register(api, huma.Operation{
		OperationID: "update-transaction-account",
		Method:      http.MethodPatch,
		Path:        "/v1/transactionAccounts/{transactionAccountId}",
		Summary:     "Update a transaction account",
		Description: "Updates an existing transaction account.",
		Tags:        []string{"Transaction Accounts"},
	}, h.UpdateTransactionAccount)

	// Delete transaction account: DELETE /transactionAccounts/{transactionAccountId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-transaction-account",
		Method:      http.MethodDelete,
		Path:        "/v1/transactionAccounts/{transactionAccountId}",
		Summary:     "Delete a transaction account",
		Description: "Deletes a transaction account.",
		Tags:        []string{"Transaction Accounts"},
	}, h.DeleteTransactionAccount)
}
