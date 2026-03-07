package importsources

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers all import source-related routes following Google AIP patterns.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewImportSourceRepository(db))

	// List import sources: GET /importSources
	huma.Register(api, huma.Operation{
		OperationID: "list-import-sources",
		Method:      http.MethodGet,
		Path:        "/v1/importSources",
		Summary:     "List import sources",
		Description: "Lists all import sources with pagination support.",
		Tags:        []string{"Import Sources"},
	}, h.ListImportSources)

	// Get import source: GET /importSources/{importSourceId}
	huma.Register(api, huma.Operation{
		OperationID: "get-import-source",
		Method:      http.MethodGet,
		Path:        "/v1/importSources/{importSourceId}",
		Summary:     "Get an import source",
		Description: "Gets a single import source by ID.",
		Tags:        []string{"Import Sources"},
	}, h.GetImportSource)

	// Create import source: POST /importSources
	huma.Register(api, huma.Operation{
		OperationID: "create-import-source",
		Method:      http.MethodPost,
		Path:        "/v1/importSources",
		Summary:     "Create an import source",
		Description: "Creates a new import source.",
		Tags:        []string{"Import Sources"},
	}, h.CreateImportSource)

	// Update import source: PATCH /importSources/{importSourceId}
	huma.Register(api, huma.Operation{
		OperationID: "update-import-source",
		Method:      http.MethodPatch,
		Path:        "/v1/importSources/{importSourceId}",
		Summary:     "Update an import source",
		Description: "Updates an existing import source.",
		Tags:        []string{"Import Sources"},
	}, h.UpdateImportSource)

	// Delete import source: DELETE /importSources/{importSourceId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-import-source",
		Method:      http.MethodDelete,
		Path:        "/v1/importSources/{importSourceId}",
		Summary:     "Delete an import source",
		Description: "Deletes an import source.",
		Tags:        []string{"Import Sources"},
	}, h.DeleteImportSource)
}
