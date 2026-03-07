package transactionassignments

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/optional"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

type TransactionAccountAssignment struct {
	ID            uuid.UUID `json:"id"`
	TransactionID uuid.UUID `json:"transactionId"`
	AccountID     uuid.UUID `json:"accountId"`
	Value         string    `json:"value" doc:"Decimal value as string"`
	UpdatedAt     time.Time `json:"updateTime"`
	CreatedAt     time.Time `json:"createTime"`
}

func (a *TransactionAccountAssignment) fromModel(m *model.TransactionAccountAssignment) {
	a.ID = m.ID
	a.TransactionID = m.TransactionID
	a.AccountID = m.AccountID
	a.Value = m.Value.String()
	a.UpdatedAt = m.UpdatedAt
	a.CreatedAt = m.CreatedAt
}

type GetTransactionAccountAssignmentRequest struct {
	TransactionID uuid.UUID `path:"transactionId"`
	AssignmentID  uuid.UUID `path:"assignmentId"`
}

type GetTransactionAccountAssignmentResponse struct {
	Body TransactionAccountAssignment
}

type ListTransactionAccountAssignmentsRequest struct {
	TransactionID uuid.UUID `path:"transactionId"`
	PageSize      int       `query:"pageSize" minimum:"1" maximum:"100" default:"20"`
	Page          int       `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	OrderBy       string    `query:"orderBy" doc:"Order by field (e.g. 'createTime desc')" maxLength:"100"`
}

type ListTransactionAccountAssignmentsResponse struct {
	Body struct {
		Assignments []TransactionAccountAssignment `json:"assignments"`
		Total       int64                          `json:"total" doc:"Total number of assignments matching the filter"`
	}
}

type CreateTransactionAccountAssignmentRequest struct {
	TransactionID uuid.UUID `path:"transactionId"`
	Body          struct {
		AccountID uuid.UUID `json:"accountId"`
		Value     string    `json:"value" doc:"Decimal value as string"`
	}
}

type CreateTransactionAccountAssignmentResponse struct {
	Body TransactionAccountAssignment
}

type UpdateTransactionAccountAssignmentRequest struct {
	TransactionID uuid.UUID `path:"transactionId"`
	AssignmentID  uuid.UUID `path:"assignmentId"`
	Body          struct {
		Value optional.OptionalParam[string] `json:"value" doc:"Decimal value as string"`
	}
}

type UpdateTransactionAccountAssignmentResponse struct {
	Body TransactionAccountAssignment
}

type DeleteTransactionAccountAssignmentRequest struct {
	TransactionID uuid.UUID `path:"transactionId"`
	AssignmentID  uuid.UUID `path:"assignmentId"`
}

type DeleteTransactionAccountAssignmentResponse struct{}
