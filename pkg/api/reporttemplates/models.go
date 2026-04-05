package reporttemplates

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/types"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// ReportTemplate is the API representation of a report template.
type ReportTemplate struct {
	ID          uuid.UUID `json:"id" doc:"Report template UUID"`
	DisplayName string    `json:"displayName" doc:"Human-readable name"`
	Template    string    `json:"template" doc:"Handlebars template content"`
	UpdatedAt   time.Time `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt   time.Time `json:"createTime" doc:"Creation timestamp"`
}

func (rt *ReportTemplate) fromModel(m *model.ReportTemplate) {
	rt.ID = m.ID
	rt.DisplayName = m.DisplayName
	rt.Template = m.Template
	rt.UpdatedAt = m.UpdatedAt
	rt.CreatedAt = m.CreatedAt
}

// --- GetReportTemplate

type GetReportTemplateRequest struct {
	ReportTemplateID uuid.UUID `path:"reportTemplateId" doc:"Report template UUID"`
}

type GetReportTemplateResponse struct {
	Body ReportTemplate
}

// --- ListReportTemplates

type ListReportTemplatesRequest struct {
	PageSize    int    `query:"pageSize" doc:"Templates per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page        int    `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	DisplayName string `query:"displayName" doc:"Filter by name prefix" maxLength:"200"`
	OrderBy     string `query:"orderBy" doc:"Order by field (e.g. 'displayName', 'createTime desc')" maxLength:"100"`
}

type ListReportTemplatesResponse struct {
	Body struct {
		ReportTemplates []ReportTemplate `json:"reportTemplates"`
		Total           int64            `json:"total" doc:"Total number of report templates matching the filter"`
	}
}

// --- CreateReportTemplate

type CreateReportTemplateRequest struct {
	Body struct {
		DisplayName string `json:"displayName" doc:"Human-readable name" maxLength:"200"`
		Template    string `json:"template" doc:"Handlebars template content"`
	}
}

type CreateReportTemplateResponse struct {
	Body ReportTemplate
}

// --- UpdateReportTemplate

type UpdateReportTemplateRequest struct {
	ReportTemplateID uuid.UUID `path:"reportTemplateId" doc:"Report template UUID"`
	Body             struct {
		DisplayName types.Optional[string] `json:"displayName,omitempty" doc:"Human-readable name" maxLength:"200"`
		Template    types.Optional[string] `json:"template,omitempty" doc:"Handlebars template content"`
	}
}

type UpdateReportTemplateResponse struct {
	Body ReportTemplate
}

// --- DeleteReportTemplate

type DeleteReportTemplateRequest struct {
	ReportTemplateID uuid.UUID `path:"reportTemplateId" doc:"Report template UUID"`
}

type DeleteReportTemplateResponse struct{}
