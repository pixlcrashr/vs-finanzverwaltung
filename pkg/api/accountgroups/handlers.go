package accountgroups

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
	ErrAccountGroupNotFound = huma.Error404NotFound("account group not found")
	ErrFailedToList         = huma.Error500InternalServerError("failed to list account groups")
	ErrFailedToCreate       = huma.Error500InternalServerError("failed to create account group")
	ErrFailedToUpdate       = huma.Error500InternalServerError("failed to update account group")
	ErrFailedToDelete       = huma.Error500InternalServerError("failed to delete account group")
	ErrInvalidOrderBy       = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.AccountGroupRepository
}

func NewHandler(repo *repository.AccountGroupRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetAccountGroup(ctx context.Context, req *GetAccountGroupRequest) (*GetAccountGroupResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AccountGroupID)
	if err != nil {
		return nil, ErrAccountGroupNotFound
	}

	ag := AccountGroup{}
	ag.fromModel(m)

	return &GetAccountGroupResponse{Body: ag}, nil
}

func (h *Handler) ListAccountGroups(ctx context.Context, req *ListAccountGroupsRequest) (*ListAccountGroupsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListAccountGroupsParams{
		NamePrefix: req.DisplayName,
		Page:       req.Page,
		PageSize:   req.PageSize,
		OrderBy:    orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListAccountGroupsResponse{}
	resp.Body.AccountGroups = lo.Map(ms, func(m *model.AccountGroup, _ int) AccountGroup {
		ag := AccountGroup{}
		ag.fromModel(m)
		return ag
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateAccountGroup(ctx context.Context, req *CreateAccountGroupRequest) (*CreateAccountGroupResponse, error) {
	now := time.Now()
	m := &model.AccountGroup{
		ID:          uuid.New(),
		DisplayName: req.Body.DisplayName,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	ag := AccountGroup{}
	ag.fromModel(m)

	return &CreateAccountGroupResponse{Body: ag}, nil
}

func (h *Handler) UpdateAccountGroup(ctx context.Context, req *UpdateAccountGroupRequest) (*UpdateAccountGroupResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AccountGroupID)
	if err != nil {
		return nil, ErrAccountGroupNotFound
	}

	if req.Body.DisplayName.IsSet {
		m.DisplayName = req.Body.DisplayName.Value
	}
	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	ag := AccountGroup{}
	ag.fromModel(m)

	return &UpdateAccountGroupResponse{Body: ag}, nil
}

func (h *Handler) DeleteAccountGroup(ctx context.Context, req *DeleteAccountGroupRequest) (*DeleteAccountGroupResponse, error) {
	// Verify account group exists
	_, err := h.repo.GetByID(ctx, req.AccountGroupID)
	if err != nil {
		return nil, ErrAccountGroupNotFound
	}

	if err := h.repo.Delete(ctx, req.AccountGroupID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteAccountGroupResponse{}, nil
}
