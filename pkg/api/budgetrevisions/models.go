package budgetrevisions

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/types"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// BudgetRevision is the API representation of a budget revision.
type BudgetRevision struct {
	ID                 uuid.UUID  `json:"id" doc:"Budget revision UUID"`
	BudgetID           uuid.UUID  `json:"budgetId" doc:"Parent budget UUID"`
	Date               types.Date `json:"date" doc:"Revision date"`
	DisplayDescription string     `json:"displayDescription" doc:"Optional free-text description"`
	UpdatedAt          time.Time  `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt          time.Time  `json:"createTime" doc:"Creation timestamp"`
}

func (br *BudgetRevision) fromModel(m *model.BudgetRevision) {
	br.ID = m.ID
	br.BudgetID = m.BudgetID
	br.Date = types.NewDate(m.Date)
	br.DisplayDescription = m.DisplayDescription
	br.UpdatedAt = m.UpdatedAt
	br.CreatedAt = m.CreatedAt
}

// --- GetBudgetRevision

type GetBudgetRevisionRequest struct {
	BudgetID   uuid.UUID `path:"budgetId" doc:"Budget UUID"`
	RevisionID uuid.UUID `path:"revisionId" doc:"Revision UUID"`
}

type GetBudgetRevisionResponse struct {
	Body BudgetRevision
}

// --- ListBudgetRevisions

type ListBudgetRevisionsRequest struct {
	BudgetID uuid.UUID `path:"budgetId" doc:"Budget UUID"`
	PageSize int       `query:"pageSize" doc:"Revisions per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page     int       `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	OrderBy  string    `query:"orderBy" doc:"Order by field (e.g. 'date desc', 'createTime')" maxLength:"100"`
}

type ListBudgetRevisionsResponse struct {
	Body struct {
		Revisions []BudgetRevision `json:"revisions"`
		Total     int64            `json:"total" doc:"Total number of revisions matching the filter"`
	}
}

// --- CreateBudgetRevision

type CreateBudgetRevisionRequest struct {
	BudgetID uuid.UUID `path:"budgetId" doc:"Budget UUID"`
	Body     struct {
		Date               types.Date             `json:"date" doc:"Revision date"`
		DisplayDescription types.Optional[string] `json:"displayDescription,omitempty" doc:"Optional description" maxLength:"1000"`
	}
}

type CreateBudgetRevisionResponse struct {
	Body BudgetRevision
}

// --- UpdateBudgetRevision

type UpdateBudgetRevisionRequest struct {
	BudgetID   uuid.UUID `path:"budgetId" doc:"Budget UUID"`
	RevisionID uuid.UUID `path:"revisionId" doc:"Revision UUID"`
	Body       struct {
		Date               types.Optional[types.Date] `json:"date,omitempty" doc:"Revision date"`
		DisplayDescription types.Optional[string]     `json:"displayDescription,omitempty" doc:"Optional description" maxLength:"1000"`
	}
}

type UpdateBudgetRevisionResponse struct {
	Body BudgetRevision
}

// --- DeleteBudgetRevision

type DeleteBudgetRevisionRequest struct {
	BudgetID   uuid.UUID `path:"budgetId" doc:"Budget UUID"`
	RevisionID uuid.UUID `path:"revisionId" doc:"Revision UUID"`
}

type DeleteBudgetRevisionResponse struct{}
