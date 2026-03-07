package reporttemplates

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
	ErrReportTemplateNotFound = huma.Error404NotFound("report template not found")
	ErrFailedToList           = huma.Error500InternalServerError("failed to list report templates")
	ErrFailedToCreate         = huma.Error500InternalServerError("failed to create report template")
	ErrFailedToUpdate         = huma.Error500InternalServerError("failed to update report template")
	ErrFailedToDelete         = huma.Error500InternalServerError("failed to delete report template")
	ErrInvalidOrderBy         = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.ReportTemplateRepository
}

func NewHandler(repo *repository.ReportTemplateRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetReportTemplate(ctx context.Context, req *GetReportTemplateRequest) (*GetReportTemplateResponse, error) {
	m, err := h.repo.GetByID(ctx, req.ReportTemplateID)
	if err != nil {
		return nil, ErrReportTemplateNotFound
	}

	rt := ReportTemplate{}
	rt.fromModel(m)

	return &GetReportTemplateResponse{Body: rt}, nil
}

func (h *Handler) ListReportTemplates(ctx context.Context, req *ListReportTemplatesRequest) (*ListReportTemplatesResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListReportTemplatesParams{
		NamePrefix: req.DisplayName,
		Page:       req.Page,
		PageSize:   req.PageSize,
		OrderBy:    orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListReportTemplatesResponse{}
	resp.Body.ReportTemplates = lo.Map(ms, func(m *model.ReportTemplate, _ int) ReportTemplate {
		rt := ReportTemplate{}
		rt.fromModel(m)
		return rt
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateReportTemplate(ctx context.Context, req *CreateReportTemplateRequest) (*CreateReportTemplateResponse, error) {
	now := time.Now()
	m := &model.ReportTemplate{
		ID:          uuid.New(),
		DisplayName: req.Body.DisplayName,
		Template:    req.Body.Template,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	rt := ReportTemplate{}
	rt.fromModel(m)

	return &CreateReportTemplateResponse{Body: rt}, nil
}

func (h *Handler) UpdateReportTemplate(ctx context.Context, req *UpdateReportTemplateRequest) (*UpdateReportTemplateResponse, error) {
	m, err := h.repo.GetByID(ctx, req.ReportTemplateID)
	if err != nil {
		return nil, ErrReportTemplateNotFound
	}

	if req.Body.DisplayName.IsSet {
		m.DisplayName = req.Body.DisplayName.Value
	}
	if req.Body.Template.IsSet {
		m.Template = req.Body.Template.Value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	rt := ReportTemplate{}
	rt.fromModel(m)

	return &UpdateReportTemplateResponse{Body: rt}, nil
}

func (h *Handler) DeleteReportTemplate(ctx context.Context, req *DeleteReportTemplateRequest) (*DeleteReportTemplateResponse, error) {
	_, err := h.repo.GetByID(ctx, req.ReportTemplateID)
	if err != nil {
		return nil, ErrReportTemplateNotFound
	}

	if err := h.repo.Delete(ctx, req.ReportTemplateID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteReportTemplateResponse{}, nil
}
