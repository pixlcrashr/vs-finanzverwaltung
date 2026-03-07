package transactionassignments

import (
	"context"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/samber/lo"
)

var (
	ErrNotFound       = huma.Error404NotFound("assignment not found")
	ErrInvalidValue   = huma.Error400BadRequest("invalid value format")
	ErrFailedToList   = huma.Error500InternalServerError("failed to list")
	ErrFailedToCreate = huma.Error500InternalServerError("failed to create")
	ErrFailedToUpdate = huma.Error500InternalServerError("failed to update")
	ErrFailedToDelete = huma.Error500InternalServerError("failed to delete")
	ErrInvalidOrderBy = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.TransactionAccountAssignmentRepository
}

func NewHandler(repo *repository.TransactionAccountAssignmentRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Get(ctx context.Context, req *GetTransactionAccountAssignmentRequest) (*GetTransactionAccountAssignmentResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AssignmentID)
	if err != nil || m.TransactionID != req.TransactionID {
		return nil, ErrNotFound
	}
	a := TransactionAccountAssignment{}
	a.fromModel(m)
	return &GetTransactionAccountAssignmentResponse{Body: a}, nil
}

func (h *Handler) List(ctx context.Context, req *ListTransactionAccountAssignmentsRequest) (*ListTransactionAccountAssignmentsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListTransactionAccountAssignmentsParams{
		TransactionID: req.TransactionID,
		Page:          req.Page,
		PageSize:      req.PageSize,
		OrderBy:       orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListTransactionAccountAssignmentsResponse{}
	resp.Body.Assignments = lo.Map(ms, func(m *model.TransactionAccountAssignment, _ int) TransactionAccountAssignment {
		a := TransactionAccountAssignment{}
		a.fromModel(m)
		return a
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) Create(ctx context.Context, req *CreateTransactionAccountAssignmentRequest) (*CreateTransactionAccountAssignmentResponse, error) {
	var value apd.Decimal
	if _, _, err := value.SetString(req.Body.Value); err != nil {
		return nil, ErrInvalidValue
	}

	now := time.Now()
	m := &model.TransactionAccountAssignment{
		ID:            uuid.New(),
		TransactionID: req.TransactionID,
		AccountID:     req.Body.AccountID,
		Value:         value,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	a := TransactionAccountAssignment{}
	a.fromModel(m)
	return &CreateTransactionAccountAssignmentResponse{Body: a}, nil
}

func (h *Handler) Update(ctx context.Context, req *UpdateTransactionAccountAssignmentRequest) (*UpdateTransactionAccountAssignmentResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AssignmentID)
	if err != nil || m.TransactionID != req.TransactionID {
		return nil, ErrNotFound
	}

	if req.Body.Value.IsSet {
		var value apd.Decimal
		if _, _, err := value.SetString(req.Body.Value.Value); err != nil {
			return nil, ErrInvalidValue
		}
		m.Value = value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	a := TransactionAccountAssignment{}
	a.fromModel(m)
	return &UpdateTransactionAccountAssignmentResponse{Body: a}, nil
}

func (h *Handler) Delete(ctx context.Context, req *DeleteTransactionAccountAssignmentRequest) (*DeleteTransactionAccountAssignmentResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AssignmentID)
	if err != nil || m.TransactionID != req.TransactionID {
		return nil, ErrNotFound
	}

	if err := h.repo.Delete(ctx, req.AssignmentID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteTransactionAccountAssignmentResponse{}, nil
}
