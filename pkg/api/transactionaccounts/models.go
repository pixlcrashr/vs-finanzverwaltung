package transactionaccounts

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/optional"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// TransactionAccount is the API representation of a transaction account (external account from imports).
type TransactionAccount struct {
	ID                 uuid.UUID `json:"id" doc:"Transaction account UUID"`
	Code               string    `json:"code" doc:"Unique account code"`
	ImportSourceID     uuid.UUID `json:"importSourceId" doc:"Import source UUID"`
	DisplayName        string    `json:"displayName" doc:"Human-readable name"`
	DisplayDescription string    `json:"displayDescription" doc:"Optional description"`
	UpdatedAt          time.Time `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt          time.Time `json:"createTime" doc:"Creation timestamp"`
}

func (ta *TransactionAccount) fromModel(m *model.TransactionAccount) {
	ta.ID = m.ID
	ta.Code = m.Code
	ta.ImportSourceID = m.ImportSourceID
	ta.DisplayName = m.DisplayName
	ta.DisplayDescription = m.DisplayDescription
	ta.UpdatedAt = m.UpdatedAt
	ta.CreatedAt = m.CreatedAt
}

// --- GetTransactionAccount

type GetTransactionAccountRequest struct {
	TransactionAccountID uuid.UUID `path:"transactionAccountId" doc:"Transaction account UUID"`
}

type GetTransactionAccountResponse struct {
	Body TransactionAccount
}

// --- ListTransactionAccounts

type ListTransactionAccountsRequest struct {
	PageSize       int                               `query:"pageSize" doc:"Accounts per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page           int                               `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	ImportSourceID optional.OptionalParam[uuid.UUID] `query:"importSourceId" doc:"Filter by import source ID"`
	Code           string                            `query:"code" doc:"Filter by code prefix" maxLength:"200"`
	OrderBy        string                            `query:"orderBy" doc:"Order by field (e.g. 'code', 'displayName', 'createTime desc')" maxLength:"100"`
}

type ListTransactionAccountsResponse struct {
	Body struct {
		TransactionAccounts []TransactionAccount `json:"transactionAccounts"`
		Total               int64                `json:"total" doc:"Total number of transaction accounts matching the filter"`
	}
}

// --- CreateTransactionAccount

type CreateTransactionAccountRequest struct {
	Body struct {
		Code               string                         `json:"code" doc:"Unique account code" maxLength:"64"`
		ImportSourceID     uuid.UUID                      `json:"importSourceId" doc:"Import source UUID"`
		DisplayName        optional.OptionalParam[string] `json:"displayName" doc:"Human-readable name" maxLength:"200"`
		DisplayDescription optional.OptionalParam[string] `json:"displayDescription,omitempty" doc:"Optional description" maxLength:"1000"`
	}
}

type CreateTransactionAccountResponse struct {
	Body TransactionAccount
}

// --- UpdateTransactionAccount

type UpdateTransactionAccountRequest struct {
	TransactionAccountID uuid.UUID `path:"transactionAccountId" doc:"Transaction account UUID"`
	Body                 struct {
		DisplayName        optional.OptionalParam[string] `json:"displayName" doc:"Human-readable name" maxLength:"200"`
		DisplayDescription optional.OptionalParam[string] `json:"displayDescription,omitempty" doc:"Optional description" maxLength:"1000"`
	}
}

type UpdateTransactionAccountResponse struct {
	Body TransactionAccount
}

// --- DeleteTransactionAccount

type DeleteTransactionAccountRequest struct {
	TransactionAccountID uuid.UUID `path:"transactionAccountId" doc:"Transaction account UUID"`
}

type DeleteTransactionAccountResponse struct{}
