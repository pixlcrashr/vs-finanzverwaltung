package importsources

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/optional"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// ImportSource is the API representation of an import source.
type ImportSource struct {
	ID                 uuid.UUID `json:"id" doc:"Import source UUID"`
	DisplayName        string    `json:"displayName" doc:"Human-readable import source name"`
	DisplayDescription string    `json:"displayDescription" doc:"Optional free-text description"`
	PeriodStart        time.Time `json:"periodStart" doc:"Period start date"`
	UpdatedAt          time.Time `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt          time.Time `json:"createTime" doc:"Creation timestamp"`
}

func (is *ImportSource) fromModel(m *model.ImportSource) {
	is.ID = m.ID
	is.DisplayName = m.DisplayName
	is.DisplayDescription = m.DisplayDescription
	is.PeriodStart = m.PeriodStart
	is.UpdatedAt = m.UpdatedAt
	is.CreatedAt = m.CreatedAt
}

// --- GetImportSource

type GetImportSourceRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId" doc:"Import source UUID"`
}

type GetImportSourceResponse struct {
	Body ImportSource
}

// --- ListImportSources

type ListImportSourcesRequest struct {
	PageSize    int    `query:"pageSize" doc:"Import sources per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page        int    `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	DisplayName string `query:"displayName" doc:"Filter by display name prefix" maxLength:"200"`
	OrderBy     string `query:"orderBy" doc:"Order by field (e.g. 'displayName', 'createTime desc')" maxLength:"100"`
}

type ListImportSourcesResponse struct {
	Body struct {
		ImportSources []ImportSource `json:"importSources"`
		Total         int64          `json:"total" doc:"Total number of import sources matching the filter"`
	}
}

// --- CreateImportSource

type CreateImportSourceRequest struct {
	Body struct {
		DisplayName        string                         `json:"displayName" doc:"Human-readable import source name" maxLength:"200"`
		DisplayDescription optional.OptionalParam[string] `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
		PeriodStart        time.Time                      `json:"periodStart" doc:"Period start date"`
	}
}

type CreateImportSourceResponse struct {
	Body ImportSource
}

// --- UpdateImportSource

type UpdateImportSourceRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId" doc:"Import source UUID"`
	Body           struct {
		DisplayName        optional.OptionalParam[string] `json:"displayName" doc:"Human-readable import source name" maxLength:"200"`
		DisplayDescription optional.OptionalParam[string] `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
	}
}

type UpdateImportSourceResponse struct {
	Body ImportSource
}

// --- DeleteImportSource

type DeleteImportSourceRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId" doc:"Import source UUID"`
}

type DeleteImportSourceResponse struct{}
