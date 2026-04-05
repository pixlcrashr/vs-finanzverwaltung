package importsources

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
	ErrImportSourceNotFound = huma.Error404NotFound("import source not found")
	ErrFailedToList         = huma.Error500InternalServerError("failed to list import sources")
	ErrFailedToCreate       = huma.Error500InternalServerError("failed to create import source")
	ErrFailedToUpdate       = huma.Error500InternalServerError("failed to update import source")
	ErrFailedToDelete       = huma.Error500InternalServerError("failed to delete import source")
	ErrInvalidOrderBy       = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.ImportSourceRepository
}

func NewHandler(repo *repository.ImportSourceRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetImportSource(ctx context.Context, req *GetImportSourceRequest) (*GetImportSourceResponse, error) {
	m, err := h.repo.GetByID(ctx, req.ImportSourceID)
	if err != nil {
		return nil, ErrImportSourceNotFound
	}

	is := ImportSource{}
	is.fromModel(m)

	return &GetImportSourceResponse{Body: is}, nil
}

func (h *Handler) ListImportSources(ctx context.Context, req *ListImportSourcesRequest) (*ListImportSourcesResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListImportSourcesParams{
		NamePrefix: req.DisplayName,
		Page:       req.Page,
		PageSize:   req.PageSize,
		OrderBy:    orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListImportSourcesResponse{}
	resp.Body.ImportSources = lo.Map(ms, func(m *model.ImportSource, _ int) ImportSource {
		is := ImportSource{}
		is.fromModel(m)
		return is
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateImportSource(ctx context.Context, req *CreateImportSourceRequest) (*CreateImportSourceResponse, error) {
	now := time.Now()
	m := &model.ImportSource{
		ID:          uuid.New(),
		DisplayName: req.Body.DisplayName,
		PeriodStart: req.Body.PeriodStart.Time,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	is := ImportSource{}
	is.fromModel(m)

	return &CreateImportSourceResponse{Body: is}, nil
}

func (h *Handler) UpdateImportSource(ctx context.Context, req *UpdateImportSourceRequest) (*UpdateImportSourceResponse, error) {
	m, err := h.repo.GetByID(ctx, req.ImportSourceID)
	if err != nil {
		return nil, ErrImportSourceNotFound
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

	is := ImportSource{}
	is.fromModel(m)

	return &UpdateImportSourceResponse{Body: is}, nil
}

func (h *Handler) DeleteImportSource(ctx context.Context, req *DeleteImportSourceRequest) (*DeleteImportSourceResponse, error) {
	// Verify import source exists
	_, err := h.repo.GetByID(ctx, req.ImportSourceID)
	if err != nil {
		return nil, ErrImportSourceNotFound
	}

	if err := h.repo.Delete(ctx, req.ImportSourceID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteImportSourceResponse{}, nil
}
