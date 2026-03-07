package transactions

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/go-pagetoken/encryption"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers all transaction-related routes following Google AIP patterns.
// Transactions use keyset pagination for efficient cursor-based pagination.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	// Generate encryption key for page tokens
	key, err := encryption.Rand32ByteKey()
	if err != nil {
		panic(err)
	}

	encryptor, err := encryption.NewAEADEncryptor(key)
	if err != nil {
		panic(err)
	}

	h := NewHandler(repository.NewTransactionRepository(db), encryptor)

	// List transactions: GET /transactions
	huma.Register(api, huma.Operation{
		OperationID: "list-transactions",
		Method:      http.MethodGet,
		Path:        "/v1/transactions",
		Summary:     "List transactions",
		Description: "Lists all transactions with keyset-based pagination support.",
		Tags:        []string{"Transactions"},
	}, h.ListTransactions)

	// Get transaction: GET /transactions/{transactionId}
	huma.Register(api, huma.Operation{
		OperationID: "get-transaction",
		Method:      http.MethodGet,
		Path:        "/v1/transactions/{transactionId}",
		Summary:     "Get a transaction",
		Description: "Gets a single transaction by ID.",
		Tags:        []string{"Transactions"},
	}, h.GetTransaction)

	// Create transaction: POST /transactions
	huma.Register(api, huma.Operation{
		OperationID: "create-transaction",
		Method:      http.MethodPost,
		Path:        "/v1/transactions",
		Summary:     "Create a transaction",
		Description: "Creates a new transaction.",
		Tags:        []string{"Transactions"},
	}, h.CreateTransaction)

	// Update transaction: PATCH /transactions/{transactionId}
	huma.Register(api, huma.Operation{
		OperationID: "update-transaction",
		Method:      http.MethodPatch,
		Path:        "/v1/transactions/{transactionId}",
		Summary:     "Update a transaction",
		Description: "Updates an existing transaction. Only description, reference, and assigned account can be modified.",
		Tags:        []string{"Transactions"},
	}, h.UpdateTransaction)

	// Delete transaction: DELETE /transactions/{transactionId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-transaction",
		Method:      http.MethodDelete,
		Path:        "/v1/transactions/{transactionId}",
		Summary:     "Delete a transaction",
		Description: "Deletes a transaction.",
		Tags:        []string{"Transactions"},
	}, h.DeleteTransaction)
}
