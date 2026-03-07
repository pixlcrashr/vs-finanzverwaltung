package budgets

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers all budget-related routes following Google AIP patterns.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewBudgetRepository(db))

	// List budgets: GET /budgets
	huma.Register(api, huma.Operation{
		OperationID: "list-budgets",
		Method:      http.MethodGet,
		Path:        "/v1/budgets",
		Summary:     "List budgets",
		Description: "Lists all budgets with pagination support.",
		Tags:        []string{"Budgets"},
	}, h.ListBudgets)

	// Get budget: GET /budgets/{budgetId}
	huma.Register(api, huma.Operation{
		OperationID: "get-budget",
		Method:      http.MethodGet,
		Path:        "/v1/budgets/{budgetId}",
		Summary:     "Get a budget",
		Description: "Gets a single budget by ID.",
		Tags:        []string{"Budgets"},
	}, h.GetBudget)

	// Create budget: POST /budgets
	huma.Register(api, huma.Operation{
		OperationID: "create-budget",
		Method:      http.MethodPost,
		Path:        "/v1/budgets",
		Summary:     "Create a budget",
		Description: "Creates a new budget.",
		Tags:        []string{"Budgets"},
	}, h.CreateBudget)

	// Update budget: PATCH /budgets/{budgetId}
	huma.Register(api, huma.Operation{
		OperationID: "update-budget",
		Method:      http.MethodPatch,
		Path:        "/v1/budgets/{budgetId}",
		Summary:     "Update a budget",
		Description: "Updates an existing budget.",
		Tags:        []string{"Budgets"},
	}, h.UpdateBudget)

	// Delete budget: DELETE /budgets/{budgetId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-budget",
		Method:      http.MethodDelete,
		Path:        "/v1/budgets/{budgetId}",
		Summary:     "Delete a budget",
		Description: "Deletes a budget.",
		Tags:        []string{"Budgets"},
	}, h.DeleteBudget)

	// Close budget: POST /budgets/{budgetId}:close (Google AIP custom method)
	huma.Register(api, huma.Operation{
		OperationID: "close-budget",
		Method:      http.MethodPost,
		Path:        "/v1/budgets/{budgetId}:close",
		Summary:     "Close a budget",
		Description: "Closes a budget, marking it as no longer active.",
		Tags:        []string{"Budgets"},
	}, h.CloseBudget)
}
