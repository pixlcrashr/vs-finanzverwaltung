package budgetrevisions

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers budget revision routes as a nested resource under budgets.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewBudgetRevisionRepository(db))

	// List budget revisions: GET /budgets/{budgetId}/revisions
	huma.Register(api, huma.Operation{
		OperationID: "list-budget-revisions",
		Method:      http.MethodGet,
		Path:        "/v1/budgets/{budgetId}/revisions",
		Summary:     "List budget revisions",
		Description: "Lists all revisions for a budget.",
		Tags:        []string{"Budget Revisions"},
	}, h.ListBudgetRevisions)

	// Get budget revision: GET /budgets/{budgetId}/revisions/{revisionId}
	huma.Register(api, huma.Operation{
		OperationID: "get-budget-revision",
		Method:      http.MethodGet,
		Path:        "/v1/budgets/{budgetId}/revisions/{revisionId}",
		Summary:     "Get a budget revision",
		Description: "Gets a single budget revision by ID.",
		Tags:        []string{"Budget Revisions"},
	}, h.GetBudgetRevision)

	// Create budget revision: POST /budgets/{budgetId}/revisions
	huma.Register(api, huma.Operation{
		OperationID: "create-budget-revision",
		Method:      http.MethodPost,
		Path:        "/v1/budgets/{budgetId}/revisions",
		Summary:     "Create a budget revision",
		Description: "Creates a new budget revision.",
		Tags:        []string{"Budget Revisions"},
	}, h.CreateBudgetRevision)

	// Update budget revision: PATCH /budgets/{budgetId}/revisions/{revisionId}
	huma.Register(api, huma.Operation{
		OperationID: "update-budget-revision",
		Method:      http.MethodPatch,
		Path:        "/v1/budgets/{budgetId}/revisions/{revisionId}",
		Summary:     "Update a budget revision",
		Description: "Updates an existing budget revision.",
		Tags:        []string{"Budget Revisions"},
	}, h.UpdateBudgetRevision)

	// Delete budget revision: DELETE /budgets/{budgetId}/revisions/{revisionId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-budget-revision",
		Method:      http.MethodDelete,
		Path:        "/v1/budgets/{budgetId}/revisions/{revisionId}",
		Summary:     "Delete a budget revision",
		Description: "Deletes a budget revision.",
		Tags:        []string{"Budget Revisions"},
	}, h.DeleteBudgetRevision)
}
