package transactions

import (
	"fmt"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/checksum"
	"github.com/pixlcrashr/vsfv/pkg/api/types"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// Transaction is the API representation of a transaction.
type Transaction struct {
	ID                         uuid.UUID `json:"id" doc:"Transaction UUID"`
	CreditTransactionAccountID uuid.UUID `json:"creditTransactionAccountId" doc:"Credit transaction account UUID"`
	DebitTransactionAccountID  uuid.UUID `json:"debitTransactionAccountId" doc:"Debit transaction account UUID"`
	Amount                     string    `json:"amount" doc:"Transaction amount as decimal string"`
	Description                string    `json:"description" doc:"Transaction description"`
	Reference                  string    `json:"reference" doc:"Transaction reference"`
	BookedAt                   time.Time `json:"bookedAt" doc:"Booking date"`
	DocumentDate               time.Time `json:"documentDate" doc:"Document date"`
	CustomID                   string    `json:"customId,omitempty" doc:"Custom external ID"`
	UpdatedAt                  time.Time `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt                  time.Time `json:"createTime" doc:"Creation timestamp"`
}

func (t *Transaction) fromModel(m *model.Transaction_) {
	t.ID = m.ID
	t.CreditTransactionAccountID = m.CreditTransactionAccountID
	t.DebitTransactionAccountID = m.DebitTransactionAccountID
	t.Amount = m.Amount.Text('f')
	t.Description = m.Description
	t.Reference = m.Reference
	t.BookedAt = m.BookedAt
	t.DocumentDate = m.DocumentDate
	t.UpdatedAt = m.UpdatedAt
	t.CreatedAt = m.CreatedAt
}

// --- GetTransaction

type GetTransactionRequest struct {
	TransactionID uuid.UUID `path:"transactionId" doc:"Transaction UUID"`
}

type GetTransactionResponse struct {
	Body Transaction
}

// --- ListTransactions (with keyset pagination)

type ListTransactionsRequest struct {
	PageSize               int                       `query:"pageSize" doc:"Transactions per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	PageToken              string                    `query:"pageToken" doc:"Opaque continuation token from the previous response; omit for the first page" maxLength:"1024"`
	CreditTransactionAccID types.Optional[uuid.UUID] `query:"creditTransactionAccountId" doc:"Filter by credit transaction account ID"`
	DebitTransactionAccID  types.Optional[uuid.UUID] `query:"debitTransactionAccountId" doc:"Filter by debit transaction account ID"`
	BookedAtStart          types.Optional[time.Time] `query:"bookedAtStart" doc:"Filter transactions booked on or after this date"`
	BookedAtEnd            types.Optional[time.Time] `query:"bookedAtEnd" doc:"Filter transactions booked on or before this date"`
}

func (r *ListTransactionsRequest) GetPageToken() string { return r.PageToken }

func (r *ListTransactionsRequest) GetChecksumFields() []checksum.BuilderOpt {
	fields := []checksum.BuilderOpt{
		checksum.Field("pageSize", fmt.Sprintf("%d", r.PageSize)),
	}
	if r.CreditTransactionAccID.IsSet {
		fields = append(fields, checksum.Field("creditTransactionAccountId", r.CreditTransactionAccID.Value.String()))
	}
	if r.DebitTransactionAccID.IsSet {
		fields = append(fields, checksum.Field("debitTransactionAccountId", r.DebitTransactionAccID.Value.String()))
	}
	if r.BookedAtStart.IsSet {
		fields = append(fields, checksum.Field("bookedAtStart", r.BookedAtStart.Value.Format(time.RFC3339)))
	}
	if r.BookedAtEnd.IsSet {
		fields = append(fields, checksum.Field("bookedAtEnd", r.BookedAtEnd.Value.Format(time.RFC3339)))
	}
	return fields
}

type ListTransactionsResponse struct {
	Body struct {
		Transactions  []Transaction `json:"transactions"`
		NextPageToken string        `json:"nextPageToken,omitempty" doc:"Pass as pageToken on the next request; empty on the last page" maxLength:"1024"`
	}
}

// --- CreateTransaction

type CreateTransactionRequest struct {
	Body struct {
		CreditTransactionAccountID uuid.UUID                 `json:"creditTransactionAccountId" doc:"Credit transaction account UUID"`
		DebitTransactionAccountID  uuid.UUID                 `json:"debitTransactionAccountId" doc:"Debit transaction account UUID"`
		Amount                     string                    `json:"amount" doc:"Transaction amount as decimal string"`
		Description                types.Optional[string]    `json:"description,omitempty" doc:"Transaction description" maxLength:"1000"`
		Reference                  types.Optional[string]    `json:"reference,omitempty" doc:"Transaction reference" maxLength:"200"`
		AssignedAccountID          types.Optional[uuid.UUID] `json:"assignedAccountId,omitempty" doc:"Assigned budget account UUID"`
		BookedAt                   time.Time                 `json:"bookedAt" doc:"Booking date"`
		DocumentDate               time.Time                 `json:"documentDate" doc:"Document date"`
	}
}

type CreateTransactionResponse struct {
	Body Transaction
}

// --- UpdateTransaction

type UpdateTransactionRequest struct {
	TransactionID uuid.UUID `path:"transactionId" doc:"Transaction UUID"`
	Body          struct {
		Description       types.Optional[string]    `json:"description,omitempty" doc:"Transaction description" maxLength:"1000"`
		Reference         types.Optional[string]    `json:"reference,omitempty" doc:"Transaction reference" maxLength:"200"`
		AssignedAccountID types.Optional[uuid.UUID] `json:"assignedAccountId,omitempty" doc:"Assigned budget account UUID"`
	}
}

type UpdateTransactionResponse struct {
	Body Transaction
}

// --- DeleteTransaction

type DeleteTransactionRequest struct {
	TransactionID uuid.UUID `path:"transactionId" doc:"Transaction UUID"`
}

type DeleteTransactionResponse struct{}

// parseDecimal parses a decimal string into apd.Decimal.
func parseDecimal(s string) (apd.Decimal, error) {
	var d apd.Decimal
	_, _, err := d.SetString(s)
	return d, err
}
