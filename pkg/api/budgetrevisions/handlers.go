package budgetrevisions

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
	ErrRevisionNotFound = huma.Error404NotFound("budget revision not found")
	ErrFailedToList     = huma.Error500InternalServerError("failed to list budget revisions")
	ErrFailedToCreate   = huma.Error500InternalServerError("failed to create budget revision")
	ErrFailedToUpdate   = huma.Error500InternalServerError("failed to update budget revision")
	ErrFailedToDelete   = huma.Error500InternalServerError("failed to delete budget revision")
	ErrInvalidOrderBy   = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.BudgetRevisionRepository
}

func NewHandler(repo *repository.BudgetRevisionRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetBudgetRevision(ctx context.Context, req *GetBudgetRevisionRequest) (*GetBudgetRevisionResponse, error) {
	m, err := h.repo.GetByID(ctx, req.RevisionID)
	if err != nil || m.BudgetID != req.BudgetID {
		return nil, ErrRevisionNotFound
	}

	br := BudgetRevision{}
	br.fromModel(m)

	return &GetBudgetRevisionResponse{Body: br}, nil
}

func (h *Handler) ListBudgetRevisions(ctx context.Context, req *ListBudgetRevisionsRequest) (*ListBudgetRevisionsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListBudgetRevisionsParams{
		BudgetID: req.BudgetID,
		Page:     req.Page,
		PageSize: req.PageSize,
		OrderBy:  orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListBudgetRevisionsResponse{}
	resp.Body.Revisions = lo.Map(ms, func(m *model.BudgetRevision, _ int) BudgetRevision {
		br := BudgetRevision{}
		br.fromModel(m)
		return br
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateBudgetRevision(ctx context.Context, req *CreateBudgetRevisionRequest) (*CreateBudgetRevisionResponse, error) {
	now := time.Now()
	m := &model.BudgetRevision{
		ID:        uuid.New(),
		BudgetID:  req.BudgetID,
		Date:      req.Body.Date,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	br := BudgetRevision{}
	br.fromModel(m)

	return &CreateBudgetRevisionResponse{Body: br}, nil
}

func (h *Handler) UpdateBudgetRevision(ctx context.Context, req *UpdateBudgetRevisionRequest) (*UpdateBudgetRevisionResponse, error) {
	m, err := h.repo.GetByID(ctx, req.RevisionID)
	if err != nil || m.BudgetID != req.BudgetID {
		return nil, ErrRevisionNotFound
	}

	if req.Body.Date.IsSet {
		m.Date = req.Body.Date.Value
	}
	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	br := BudgetRevision{}
	br.fromModel(m)

	return &UpdateBudgetRevisionResponse{Body: br}, nil
}

func (h *Handler) DeleteBudgetRevision(ctx context.Context, req *DeleteBudgetRevisionRequest) (*DeleteBudgetRevisionResponse, error) {
	m, err := h.repo.GetByID(ctx, req.RevisionID)
	if err != nil || m.BudgetID != req.BudgetID {
		return nil, ErrRevisionNotFound
	}

	if err := h.repo.Delete(ctx, req.RevisionID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteBudgetRevisionResponse{}, nil
}
