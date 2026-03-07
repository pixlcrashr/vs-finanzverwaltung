package reporttemplates

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers report template routes.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewReportTemplateRepository(db))

	// List report templates: GET /reportTemplates
	huma.Register(api, huma.Operation{
		OperationID: "list-report-templates",
		Method:      http.MethodGet,
		Path:        "/v1/reportTemplates",
		Summary:     "List report templates",
		Description: "Lists all report templates.",
		Tags:        []string{"Report Templates"},
	}, h.ListReportTemplates)

	// Get report template: GET /reportTemplates/{reportTemplateId}
	huma.Register(api, huma.Operation{
		OperationID: "get-report-template",
		Method:      http.MethodGet,
		Path:        "/v1/reportTemplates/{reportTemplateId}",
		Summary:     "Get a report template",
		Description: "Gets a single report template by ID.",
		Tags:        []string{"Report Templates"},
	}, h.GetReportTemplate)

	// Create report template: POST /reportTemplates
	huma.Register(api, huma.Operation{
		OperationID: "create-report-template",
		Method:      http.MethodPost,
		Path:        "/v1/reportTemplates",
		Summary:     "Create a report template",
		Description: "Creates a new report template.",
		Tags:        []string{"Report Templates"},
	}, h.CreateReportTemplate)

	// Update report template: PATCH /reportTemplates/{reportTemplateId}
	huma.Register(api, huma.Operation{
		OperationID: "update-report-template",
		Method:      http.MethodPatch,
		Path:        "/v1/reportTemplates/{reportTemplateId}",
		Summary:     "Update a report template",
		Description: "Updates an existing report template.",
		Tags:        []string{"Report Templates"},
	}, h.UpdateReportTemplate)

	// Delete report template: DELETE /reportTemplates/{reportTemplateId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-report-template",
		Method:      http.MethodDelete,
		Path:        "/v1/reportTemplates/{reportTemplateId}",
		Summary:     "Delete a report template",
		Description: "Deletes a report template.",
		Tags:        []string{"Report Templates"},
	}, h.DeleteReportTemplate)
}
