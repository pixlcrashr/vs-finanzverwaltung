package importsourceperiods

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
	ErrNotFound       = huma.Error404NotFound("period not found")
	ErrFailedToList   = huma.Error500InternalServerError("failed to list")
	ErrFailedToCreate = huma.Error500InternalServerError("failed to create")
	ErrFailedToUpdate = huma.Error500InternalServerError("failed to update")
	ErrFailedToDelete = huma.Error500InternalServerError("failed to delete")
	ErrInvalidOrderBy = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.ImportSourcePeriodRepository
}

func NewHandler(repo *repository.ImportSourcePeriodRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) Get(ctx context.Context, req *GetImportSourcePeriodRequest) (*GetImportSourcePeriodResponse, error) {
	m, err := h.repo.GetByID(ctx, req.PeriodID)
	if err != nil || m.ImportSourceID != req.ImportSourceID {
		return nil, ErrNotFound
	}
	p := ImportSourcePeriod{}
	p.fromModel(m)
	return &GetImportSourcePeriodResponse{Body: p}, nil
}

func (h *Handler) List(ctx context.Context, req *ListImportSourcePeriodsRequest) (*ListImportSourcePeriodsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListImportSourcePeriodsParams{
		ImportSourceID: req.ImportSourceID,
		Page:           req.Page,
		PageSize:       req.PageSize,
		OrderBy:        orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListImportSourcePeriodsResponse{}
	resp.Body.Periods = lo.Map(ms, func(m *model.ImportSourcePeriod, _ int) ImportSourcePeriod {
		p := ImportSourcePeriod{}
		p.fromModel(m)
		return p
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) Create(ctx context.Context, req *CreateImportSourcePeriodRequest) (*CreateImportSourcePeriodResponse, error) {
	now := time.Now()
	m := &model.ImportSourcePeriod{
		ID:             uuid.New(),
		ImportSourceID: req.ImportSourceID,
		Year:           req.Body.Year,
		IsClosed:       false,
		CreatedAt:      now,
		UpdatedAt:      now,
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	p := ImportSourcePeriod{}
	p.fromModel(m)
	return &CreateImportSourcePeriodResponse{Body: p}, nil
}

func (h *Handler) Close(ctx context.Context, req *CloseImportSourcePeriodRequest) (*CloseImportSourcePeriodResponse, error) {
	m, err := h.repo.GetByID(ctx, req.PeriodID)
	if err != nil || m.ImportSourceID != req.ImportSourceID {
		return nil, ErrNotFound
	}

	m.IsClosed = true
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	p := ImportSourcePeriod{}
	p.fromModel(m)
	return &CloseImportSourcePeriodResponse{Body: p}, nil
}

func (h *Handler) Delete(ctx context.Context, req *DeleteImportSourcePeriodRequest) (*DeleteImportSourcePeriodResponse, error) {
	m, err := h.repo.GetByID(ctx, req.PeriodID)
	if err != nil || m.ImportSourceID != req.ImportSourceID {
		return nil, ErrNotFound
	}

	if err := h.repo.Delete(ctx, req.PeriodID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteImportSourcePeriodResponse{}, nil
}
