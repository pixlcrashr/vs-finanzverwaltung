package accounts

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/optional"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// Account is the API representation of a budget account.
type Account struct {
	ID                 uuid.UUID  `json:"id" doc:"Account UUID"`
	ParentAccountID    *uuid.UUID `json:"parentAccountId,omitempty" doc:"Parent account UUID; null for root accounts"`
	DisplayName        string     `json:"displayName" doc:"Human-readable account name"`
	DisplayCode        string     `json:"displayCode" doc:"Short account code"`
	DisplayDescription string     `json:"displayDescription" doc:"Optional free-text description"`
	IsArchived         bool       `json:"isArchived" doc:"Whether the account is archived"`
	UpdatedAt          time.Time  `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt          time.Time  `json:"createTime" doc:"Creation timestamp"`
}

func (a *Account) fromModel(m *model.Account) {
	a.ID = m.ID
	a.DisplayName = m.DisplayName
	a.DisplayCode = m.DisplayCode
	a.DisplayDescription = m.DisplayDescription
	a.IsArchived = m.IsArchived
	a.UpdatedAt = m.UpdatedAt
	a.CreatedAt = m.CreatedAt

	if m.ParentAccountID.Valid {
		a.ParentAccountID = &m.ParentAccountID.UUID
	}
}

// --- GetAccount

type GetAccountRequest struct {
	AccountID uuid.UUID `path:"accountId" doc:"Account UUID"`
}

type GetAccountResponse struct {
	Body Account
}

// --- ListAccounts

type ListAccountsRequest struct {
	PageSize        int    `query:"pageSize" doc:"Accounts per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page            int    `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	DisplayName     string `query:"displayName" doc:"Filter by display name prefix" maxLength:"200"`
	IncludeArchived bool   `query:"showDeleted" doc:"Include archived accounts (default false)"`
	OrderBy         string `query:"orderBy" doc:"Order by field (e.g. 'displayName', 'displayCode', 'createTime desc')" maxLength:"100"`
}

type ListAccountsResponse struct {
	Body struct {
		Accounts []Account `json:"accounts"`
		Total    int64     `json:"total" doc:"Total number of accounts matching the filter"`
	}
}

// --- CreateAccount

type CreateAccountRequest struct {
	Body struct {
		ParentAccountID    optional.OptionalParam[uuid.UUID] `json:"parentAccountId,omitempty" doc:"Parent account UUID; omit for root accounts"`
		DisplayName        string                            `json:"displayName" doc:"Human-readable account name" maxLength:"200"`
		DisplayCode        string                            `json:"displayCode" doc:"Short account code" maxLength:"50"`
		DisplayDescription optional.OptionalParam[string]    `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
	}
}

type CreateAccountResponse struct {
	Body Account
}

// --- UpdateAccount

type UpdateAccountRequest struct {
	AccountID uuid.UUID `path:"accountId" doc:"Account UUID"`
	Body      struct {
		ParentAccountID    optional.OptionalParam[uuid.UUID] `json:"parentAccountId,omitempty" doc:"Parent account UUID; omit for root accounts"`
		DisplayName        optional.OptionalParam[string]    `json:"displayName" doc:"Human-readable account name" maxLength:"200"`
		DisplayDescription optional.OptionalParam[string]    `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
	}
}

type UpdateAccountResponse struct {
	Body Account
}

// --- ArchiveAccount

type ArchiveAccountRequest struct {
	AccountID uuid.UUID `path:"accountId" doc:"Account UUID"`
}

type ArchiveAccountResponse struct {
	Body Account
}

// --- DeleteAccount

type DeleteAccountRequest struct {
	AccountID uuid.UUID `path:"accountId" doc:"Account UUID"`
}

type DeleteAccountResponse struct{}
