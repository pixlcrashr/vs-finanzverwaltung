package accountgroups

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/types"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// AccountGroup is the API representation of an account group.
type AccountGroup struct {
	ID                 uuid.UUID `json:"id" doc:"Account group UUID"`
	DisplayName        string    `json:"displayName" doc:"Human-readable account group name"`
	DisplayDescription string    `json:"displayDescription" doc:"Optional free-text description"`
	UpdatedAt          time.Time `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt          time.Time `json:"createTime" doc:"Creation timestamp"`
}

func (ag *AccountGroup) fromModel(m *model.AccountGroup) {
	ag.ID = m.ID
	ag.DisplayName = m.DisplayName
	ag.DisplayDescription = m.DisplayDescription
	ag.UpdatedAt = m.UpdatedAt
	ag.CreatedAt = m.CreatedAt
}

// --- GetAccountGroup

type GetAccountGroupRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId" doc:"Account group UUID"`
}

type GetAccountGroupResponse struct {
	Body AccountGroup
}

// --- ListAccountGroups

type ListAccountGroupsRequest struct {
	PageSize    int    `query:"pageSize" doc:"Account groups per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page        int    `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	DisplayName string `query:"displayName" doc:"Filter by display name prefix" maxLength:"200"`
	OrderBy     string `query:"orderBy" doc:"Order by field (e.g. 'displayName', 'createTime desc')" maxLength:"100"`
}

type ListAccountGroupsResponse struct {
	Body struct {
		AccountGroups []AccountGroup `json:"accountGroups"`
		Total         int64          `json:"total" doc:"Total number of account groups matching the filter"`
	}
}

// --- CreateAccountGroup

type CreateAccountGroupRequest struct {
	Body struct {
		DisplayName        string                 `json:"displayName" doc:"Human-readable account group name" maxLength:"200"`
		DisplayDescription types.Optional[string] `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
	}
}

type CreateAccountGroupResponse struct {
	Body AccountGroup
}

// --- UpdateAccountGroup

type UpdateAccountGroupRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId" doc:"Account group UUID"`
	Body           struct {
		DisplayName        types.Optional[string] `json:"displayName" doc:"Human-readable account group name" maxLength:"200"`
		DisplayDescription types.Optional[string] `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
	}
}

type UpdateAccountGroupResponse struct {
	Body AccountGroup
}

// --- DeleteAccountGroup

type DeleteAccountGroupRequest struct {
	AccountGroupID uuid.UUID `path:"accountGroupId" doc:"Account group UUID"`
}

type DeleteAccountGroupResponse struct{}
