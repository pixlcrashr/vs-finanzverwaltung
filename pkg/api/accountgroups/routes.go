package accountgroups

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers all account group-related routes following Google AIP patterns.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewAccountGroupRepository(db))

	// List account groups: GET /accountGroups
	huma.Register(api, huma.Operation{
		OperationID: "list-account-groups",
		Method:      http.MethodGet,
		Path:        "/v1/accountGroups",
		Summary:     "List account groups",
		Description: "Lists all account groups with pagination support.",
		Tags:        []string{"Account Groups"},
	}, h.ListAccountGroups)

	// Get account group: GET /accountGroups/{accountGroupId}
	huma.Register(api, huma.Operation{
		OperationID: "get-account-group",
		Method:      http.MethodGet,
		Path:        "/v1/accountGroups/{accountGroupId}",
		Summary:     "Get an account group",
		Description: "Gets a single account group by ID.",
		Tags:        []string{"Account Groups"},
	}, h.GetAccountGroup)

	// Create account group: POST /accountGroups
	huma.Register(api, huma.Operation{
		OperationID: "create-account-group",
		Method:      http.MethodPost,
		Path:        "/v1/accountGroups",
		Summary:     "Create an account group",
		Description: "Creates a new account group.",
		Tags:        []string{"Account Groups"},
	}, h.CreateAccountGroup)

	// Update account group: PATCH /accountGroups/{accountGroupId}
	huma.Register(api, huma.Operation{
		OperationID: "update-account-group",
		Method:      http.MethodPatch,
		Path:        "/v1/accountGroups/{accountGroupId}",
		Summary:     "Update an account group",
		Description: "Updates an existing account group.",
		Tags:        []string{"Account Groups"},
	}, h.UpdateAccountGroup)

	// Delete account group: DELETE /accountGroups/{accountGroupId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-account-group",
		Method:      http.MethodDelete,
		Path:        "/v1/accountGroups/{accountGroupId}",
		Summary:     "Delete an account group",
		Description: "Deletes an account group.",
		Tags:        []string{"Account Groups"},
	}, h.DeleteAccountGroup)
}
