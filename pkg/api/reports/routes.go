package reports

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"gorm.io/gorm"
)

// RegisterRoutes registers report routes.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	h := NewHandler(repository.NewReportRepository(db))

	// List reports: GET /reports
	huma.Register(api, huma.Operation{
		OperationID: "list-reports",
		Method:      http.MethodGet,
		Path:        "/v1/reports",
		Summary:     "List reports",
		Description: "Lists all generated reports (without data).",
		Tags:        []string{"Reports"},
	}, h.ListReports)

	// Get report: GET /reports/{reportId}
	huma.Register(api, huma.Operation{
		OperationID: "get-report",
		Method:      http.MethodGet,
		Path:        "/v1/reports/{reportId}",
		Summary:     "Get a report",
		Description: "Gets a single report metadata.",
		Tags:        []string{"Reports"},
	}, h.GetReport)

	// Download report: GET /reports/{reportId}:download
	huma.Register(api, huma.Operation{
		OperationID: "download-report",
		Method:      http.MethodGet,
		Path:        "/v1/reports/{reportId}:download",
		Summary:     "Download a report",
		Description: "Downloads a report with its base64-encoded data.",
		Tags:        []string{"Reports"},
	}, h.DownloadReport)

	// Create report: POST /reports
	huma.Register(api, huma.Operation{
		OperationID: "create-report",
		Method:      http.MethodPost,
		Path:        "/v1/reports",
		Summary:     "Create a report",
		Description: "Creates a new report.",
		Tags:        []string{"Reports"},
	}, h.CreateReport)

	// Delete report: DELETE /reports/{reportId}
	huma.Register(api, huma.Operation{
		OperationID: "delete-report",
		Method:      http.MethodDelete,
		Path:        "/v1/reports/{reportId}",
		Summary:     "Delete a report",
		Description: "Deletes a report.",
		Tags:        []string{"Reports"},
	}, h.DeleteReport)
}
