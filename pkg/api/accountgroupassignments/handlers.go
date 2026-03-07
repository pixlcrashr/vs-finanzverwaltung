package accountgroupassignments

import (
	"context"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/samber/lo"
)

var (
	ErrNotFound       = huma.Error404NotFound("assignment not found")
	ErrFailedToList   = huma.Error500InternalServerError("failed to list")
	ErrFailedToCreate = huma.Error500InternalServerError("failed to create")
	ErrFailedToUpdate = huma.Error500InternalServerError("failed to update")
	ErrFailedToDelete = huma.Error500InternalServerError("failed to delete")
	ErrInvalidOrderBy = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.AccountGroupAssignmentRepository
}

func NewHandler(repo *repository.AccountGroupAssignmentRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Get(ctx context.Context, req *GetAccountGroupAssignmentRequest) (*GetAccountGroupAssignmentResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AssignmentID)
	if err != nil || m.AccountGroupID != req.AccountGroupID {
		return nil, ErrNotFound
	}
	a := AccountGroupAssignment{}
	a.fromModel(m)
	return &GetAccountGroupAssignmentResponse{Body: a}, nil
}

func (h *Handler) List(ctx context.Context, req *ListAccountGroupAssignmentsRequest) (*ListAccountGroupAssignmentsResponse, error) {
	var accountID *uuid.UUID
	if req.AccountID.IsSet {
		accountID = &req.AccountID.Value
	}
	var negate *bool
	if req.Negate.IsSet {
		negate = &req.Negate.Value
	}

	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListAccountGroupAssignmentsParams{
		AccountGroupID: req.AccountGroupID,
		AccountID:      accountID,
		Negate:         negate,
		Page:           req.Page,
		PageSize:       req.PageSize,
		OrderBy:        orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListAccountGroupAssignmentsResponse{}
	resp.Body.Assignments = lo.Map(ms, func(m *model.AccountGroupAssignment, _ int) AccountGroupAssignment {
		a := AccountGroupAssignment{}
		a.fromModel(m)
		return a
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) Create(ctx context.Context, req *CreateAccountGroupAssignmentRequest) (*CreateAccountGroupAssignmentResponse, error) {
	now := time.Now()
	m := &model.AccountGroupAssignment{
		ID:             uuid.New(),
		AccountGroupID: req.AccountGroupID,
		AccountID:      req.Body.AccountID,
		Negate:         req.Body.Negate,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	a := AccountGroupAssignment{}
	a.fromModel(m)
	return &CreateAccountGroupAssignmentResponse{Body: a}, nil
}

func (h *Handler) Update(ctx context.Context, req *UpdateAccountGroupAssignmentRequest) (*UpdateAccountGroupAssignmentResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AssignmentID)
	if err != nil || m.AccountGroupID != req.AccountGroupID {
		return nil, ErrNotFound
	}

	if req.Body.Negate.IsSet {
		m.Negate = req.Body.Negate.Value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	a := AccountGroupAssignment{}
	a.fromModel(m)
	return &UpdateAccountGroupAssignmentResponse{Body: a}, nil
}

func (h *Handler) Delete(ctx context.Context, req *DeleteAccountGroupAssignmentRequest) (*DeleteAccountGroupAssignmentResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AssignmentID)
	if err != nil || m.AccountGroupID != req.AccountGroupID {
		return nil, ErrNotFound
	}

	if err := h.repo.Delete(ctx, req.AssignmentID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteAccountGroupAssignmentResponse{}, nil
}
