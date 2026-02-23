package accountsexample

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/checksum"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// --- Account Model

type Account struct {
	ID                 uuid.UUID     `json:"id" doc:"Account UUID"`
	ParentAccountID    uuid.NullUUID `json:"parent_account_id" doc:"Parent account UUID; absent for root accounts"`
	DisplayName        string        `json:"display_name" doc:"Human-readable account name"`
	DisplayCode        string        `json:"display_code" doc:"Short account code"`
	DisplayDescription string        `json:"display_description" doc:"Optional free-text description"`
	IsArchived         bool          `json:"is_archived" doc:"Whether the account is archived"`
	UpdatedAt          time.Time     `json:"updated_at" doc:"Last modification timestamp"`
	CreatedAt          time.Time     `json:"created_at" doc:"Creation timestamp"`
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
		a.ParentAccountID = uuid.NullUUID{UUID: m.ParentAccountID.UUID, Valid: true}
	}
}

// --- GetAccount

type GetAccountRequest struct {
	AccountID uuid.UUID `path:"account_id" doc:"Account UUID"`
}

type GetAccountResponse struct {
	Body Account
}

// --- ListAccounts

type ListAccountsRequest struct {
	Name            string `query:"name" doc:"Case-sensitive prefix filter on display_name" maxLength:"200"`
	IncludeArchived bool   `query:"include_archived" doc:"Include archived accounts (default false)"`
	OrderBy         string `query:"order_by" doc:"Sort expression, e.g. 'display_code, display_name desc'. Available: id, display_name, display_code, created_at, updated_at"`
	PageSize        int    `query:"page_size" doc:"Accounts per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	PageToken       string `query:"page_token" doc:"Opaque continuation token from the previous response; omit for the first page" maxLength:"512"`
}

func (i *ListAccountsRequest) GetPageToken() string { return i.PageToken }
func (i *ListAccountsRequest) GetChecksumFields() []checksum.BuilderOpt {
	return []checksum.BuilderOpt{
		checksum.Field("name", i.Name),
		checksum.Field("include_archived", fmt.Sprintf("%v", i.IncludeArchived)),
		checksum.Field("order_by", i.OrderBy),
	}
}

type ListAccountsResponse struct {
	Body struct {
		Accounts      []Account `json:"accounts"`
		NextPageToken string    `json:"next_page_token" doc:"Pass as page_token on the next request; empty on the last page" maxLength:"512"`
	}
}
