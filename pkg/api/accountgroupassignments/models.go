package accountgroupassignments

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/optional"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

type AccountGroupAssignment struct {
	ID             uuid.UUID `json:"id"`
	AccountGroupID uuid.UUID `json:"accountGroupId"`
	AccountID      uuid.UUID `json:"accountId"`
	Negate         bool      `json:"negate" doc:"Whether to exclude this account from the group"`
	UpdatedAt      time.Time `json:"updateTime"`
	CreatedAt      time.Time `json:"createTime"`
}

func (a *AccountGroupAssignment) fromModel(m *model.AccountGroupAssignment) {
	a.ID = m.ID
	a.AccountGroupID = m.AccountGroupID
	a.AccountID = m.AccountID
	a.Negate = m.Negate
	a.UpdatedAt = m.UpdatedAt
	a.CreatedAt = m.CreatedAt
}

type GetAccountGroupAssignmentRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId"`
	AssignmentID   uuid.UUID `path:"assignmentId"`
}

type GetAccountGroupAssignmentResponse struct {
	Body AccountGroupAssignment
}

type ListAccountGroupAssignmentsRequest struct {
	AccountGroupID uuid.UUID                         `path:"accountGroupId"`
	PageSize       int                               `query:"pageSize" minimum:"1" maximum:"100" default:"20"`
	Page           int                               `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	AccountID      optional.OptionalParam[uuid.UUID] `query:"accountId" doc:"Filter by account ID"`
	Negate         optional.OptionalParam[bool]      `query:"negate" doc:"Filter by negate flag"`
	OrderBy        string                            `query:"orderBy" doc:"Order by field (e.g. 'createTime desc')" maxLength:"100"`
}

type ListAccountGroupAssignmentsResponse struct {
	Body struct {
		Assignments []AccountGroupAssignment `json:"assignments"`
		Total       int64                    `json:"total" doc:"Total number of assignments matching the filter"`
	}
}

type CreateAccountGroupAssignmentRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId"`
	Body           struct {
		AccountID uuid.UUID `json:"accountId"`
		Negate    bool      `json:"negate"`
	}
}

type CreateAccountGroupAssignmentResponse struct {
	Body AccountGroupAssignment
}

type UpdateAccountGroupAssignmentRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId"`
	AssignmentID   uuid.UUID `path:"assignmentId"`
	Body           struct {
		Negate optional.OptionalParam[bool] `json:"negate"`
	}
}

type UpdateAccountGroupAssignmentResponse struct {
	Body AccountGroupAssignment
}

type DeleteAccountGroupAssignmentRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId"`
	AssignmentID   uuid.UUID `path:"assignmentId"`
}

type DeleteAccountGroupAssignmentResponse struct{}
