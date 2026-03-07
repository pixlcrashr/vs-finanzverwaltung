package reports

import (
	"context"
	"encoding/base64"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/samber/lo"
)

var (
	ErrReportNotFound = huma.Error404NotFound("report not found")
	ErrFailedToList   = huma.Error500InternalServerError("failed to list reports")
	ErrFailedToCreate = huma.Error500InternalServerError("failed to create report")
	ErrFailedToDelete = huma.Error500InternalServerError("failed to delete report")
	ErrInvalidOrderBy = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.ReportRepository
}

func NewHandler(repo *repository.ReportRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetReport(ctx context.Context, req *GetReportRequest) (*GetReportResponse, error) {
	m, err := h.repo.GetByID(ctx, req.ReportID)
	if err != nil {
		return nil, ErrReportNotFound
	}

	r := Report{}
	r.fromModel(m)

	return &GetReportResponse{Body: r}, nil
}

func (h *Handler) DownloadReport(ctx context.Context, req *DownloadReportRequest) (*DownloadReportResponse, error) {
	m, err := h.repo.GetByID(ctx, req.ReportID)
	if err != nil {
		return nil, ErrReportNotFound
	}

	resp := &DownloadReportResponse{}
	resp.Body.Data = base64.StdEncoding.EncodeToString(m.Data)

	return resp, nil
}

func (h *Handler) ListReports(ctx context.Context, req *ListReportsRequest) (*ListReportsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListReportsParams{
		NamePrefix: req.DisplayName,
		Page:       req.Page,
		PageSize:   req.PageSize,
		OrderBy:    orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListReportsResponse{}
	resp.Body.Reports = lo.Map(ms, func(m *model.Report, _ int) Report {
		r := Report{}
		r.fromModel(m)
		return r
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateReport(ctx context.Context, req *CreateReportRequest) (*CreateReportResponse, error) {
	m := &model.Report{
		ID:          uuid.New(),
		DisplayName: req.Body.DisplayName,
		CreatedAt:   time.Now(),
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	r := Report{}
	r.fromModel(m)

	return &CreateReportResponse{Body: r}, nil
}

func (h *Handler) DeleteReport(ctx context.Context, req *DeleteReportRequest) (*DeleteReportResponse, error) {
	_, err := h.repo.GetByID(ctx, req.ReportID)
	if err != nil {
		return nil, ErrReportNotFound
	}

	if err := h.repo.Delete(ctx, req.ReportID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteReportResponse{}, nil
}
