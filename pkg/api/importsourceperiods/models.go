package importsourceperiods

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

type ImportSourcePeriod struct {
	ID             uuid.UUID `json:"id"`
	ImportSourceID uuid.UUID `json:"importSourceId"`
	Year           int       `json:"year"`
	IsClosed       bool      `json:"isClosed" doc:"Whether this period is closed for new imports"`
	UpdatedAt      time.Time `json:"updateTime"`
	CreatedAt      time.Time `json:"createTime"`
}

func (p *ImportSourcePeriod) fromModel(m *model.ImportSourcePeriod) {
	p.ID = m.ID
	p.ImportSourceID = m.ImportSourceID
	p.Year = m.Year
	p.IsClosed = m.IsClosed
	p.UpdatedAt = m.UpdatedAt
	p.CreatedAt = m.CreatedAt
}

type GetImportSourcePeriodRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId"`
	PeriodID       uuid.UUID `path:"periodId"`
}

type GetImportSourcePeriodResponse struct {
	Body ImportSourcePeriod
}

type ListImportSourcePeriodsRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId"`
	PageSize       int       `query:"pageSize" minimum:"1" maximum:"100" default:"20"`
	Page           int       `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	OrderBy        string    `query:"orderBy" doc:"Order by field (e.g. 'year desc', 'createTime')" maxLength:"100"`
}

type ListImportSourcePeriodsResponse struct {
	Body struct {
		Periods []ImportSourcePeriod `json:"periods"`
		Total   int64                `json:"total" doc:"Total number of periods matching the filter"`
	}
}

type CreateImportSourcePeriodRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId"`
	Body           struct {
		Year int `json:"year"`
	}
}

type CreateImportSourcePeriodResponse struct {
	Body ImportSourcePeriod
}

// --- CloseImportSourcePeriod

type CloseImportSourcePeriodRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId"`
	PeriodID       uuid.UUID `path:"periodId"`
}

type CloseImportSourcePeriodResponse struct {
	Body ImportSourcePeriod
}

type DeleteImportSourcePeriodRequest struct {
	ImportSourceID uuid.UUID `path:"importSourceId"`
	PeriodID       uuid.UUID `path:"periodId"`
}

type DeleteImportSourcePeriodResponse struct{}
