package reports

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// Report is the API representation of a generated report.
type Report struct {
	ID          uuid.UUID `json:"id" doc:"Report UUID"`
	DisplayName string    `json:"displayName" doc:"Human-readable name"`
	CreatedAt   time.Time `json:"createTime" doc:"Creation timestamp"`
}

func (r *Report) fromModel(m *model.Report) {
	r.ID = m.ID
	r.DisplayName = m.DisplayName
	r.CreatedAt = m.CreatedAt
}

// --- GetReport

type GetReportRequest struct {
	ReportID uuid.UUID `path:"reportId" doc:"Report UUID"`
}

type GetReportResponse struct {
	Body Report
}

// --- DownloadReport

type DownloadReportRequest struct {
	ReportID uuid.UUID `path:"reportId" doc:"Report UUID"`
}

type DownloadReportResponse struct {
	Body struct {
		Data string `json:"data" doc:"Base64-encoded report data"`
	}
}

// --- ListReports

type ListReportsRequest struct {
	PageSize    int    `query:"pageSize" doc:"Reports per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page        int    `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	DisplayName string `query:"displayName" doc:"Filter by name prefix" maxLength:"200"`
	OrderBy     string `query:"orderBy" doc:"Order by field (e.g. 'displayName', 'createTime desc')" maxLength:"100"`
}

type ListReportsResponse struct {
	Body struct {
		Reports []Report `json:"reports"`
		Total   int64    `json:"total" doc:"Total number of reports matching the filter"`
	}
}

// --- CreateReport

type CreateReportRequest struct {
	Body struct {
		ReportTemplateID uuid.UUID `json:"reportTemplateId" doc:"Report template UUID"`
		DisplayName      string    `json:"displayName" doc:"Human-readable name" maxLength:"200"`
	}
}

type CreateReportResponse struct {
	Body Report
}

// --- DeleteReport

type DeleteReportRequest struct {
	ReportID uuid.UUID `path:"reportId" doc:"Report UUID"`
}

type DeleteReportResponse struct{}
