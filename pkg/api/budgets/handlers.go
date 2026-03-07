package budgets

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
	ErrBudgetNotFound = huma.Error404NotFound("budget not found")
	ErrFailedToList   = huma.Error500InternalServerError("failed to list budgets")
	ErrFailedToCreate = huma.Error500InternalServerError("failed to create budget")
	ErrFailedToUpdate = huma.Error500InternalServerError("failed to update budget")
	ErrFailedToDelete = huma.Error500InternalServerError("failed to delete budget")
	ErrFailedToClose  = huma.Error500InternalServerError("failed to close budget")
	ErrInvalidOrderBy = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.BudgetRepository
}

func NewHandler(repo *repository.BudgetRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetBudget(ctx context.Context, req *GetBudgetRequest) (*GetBudgetResponse, error) {
	m, err := h.repo.GetByID(ctx, req.BudgetID)
	if err != nil {
		return nil, ErrBudgetNotFound
	}

	b := Budget{}
	b.fromModel(m)

	return &GetBudgetResponse{Body: b}, nil
}

func (h *Handler) ListBudgets(ctx context.Context, req *ListBudgetsRequest) (*ListBudgetsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListBudgetsParams{
		NamePrefix:    req.DisplayName,
		IncludeClosed: req.IncludeClosed,
		Page:          req.Page,
		PageSize:      req.PageSize,
		OrderBy:       orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListBudgetsResponse{}
	resp.Body.Budgets = lo.Map(ms, func(m *model.Budget, _ int) Budget {
		b := Budget{}
		b.fromModel(m)
		return b
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateBudget(ctx context.Context, req *CreateBudgetRequest) (*CreateBudgetResponse, error) {
	now := time.Now()
	m := &model.Budget{
		ID:          uuid.New(),
		DisplayName: req.Body.DisplayName,
		IsClosed:    false,
		PeriodStart: req.Body.PeriodStart,
		PeriodEnd:   req.Body.PeriodEnd,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	b := Budget{}
	b.fromModel(m)

	return &CreateBudgetResponse{Body: b}, nil
}

func (h *Handler) UpdateBudget(ctx context.Context, req *UpdateBudgetRequest) (*UpdateBudgetResponse, error) {
	m, err := h.repo.GetByID(ctx, req.BudgetID)
	if err != nil {
		return nil, ErrBudgetNotFound
	}

	if req.Body.DisplayName.IsSet {
		m.DisplayName = req.Body.DisplayName.Value
	}
	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}
	if req.Body.PeriodStart.IsSet {
		m.PeriodStart = req.Body.PeriodStart.Value
	}
	if req.Body.PeriodEnd.IsSet {
		m.PeriodEnd = req.Body.PeriodEnd.Value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	b := Budget{}
	b.fromModel(m)

	return &UpdateBudgetResponse{Body: b}, nil
}

func (h *Handler) DeleteBudget(ctx context.Context, req *DeleteBudgetRequest) (*DeleteBudgetResponse, error) {
	// Verify budget exists
	_, err := h.repo.GetByID(ctx, req.BudgetID)
	if err != nil {
		return nil, ErrBudgetNotFound
	}

	if err := h.repo.Delete(ctx, req.BudgetID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteBudgetResponse{}, nil
}

func (h *Handler) CloseBudget(ctx context.Context, req *CloseBudgetRequest) (*CloseBudgetResponse, error) {
	m, err := h.repo.GetByID(ctx, req.BudgetID)
	if err != nil {
		return nil, ErrBudgetNotFound
	}

	m.IsClosed = true
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToClose
	}

	b := Budget{}
	b.fromModel(m)

	return &CloseBudgetResponse{Body: b}, nil
}
