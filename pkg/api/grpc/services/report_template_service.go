package services

import (
	"context"

	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type reportTemplateServiceServer struct {
	gen.UnimplementedReportTemplateServiceServer
	repo *repository.ReportTemplateRepository
}

func newReportTemplateServiceServer(repo *repository.ReportTemplateRepository) gen.ReportTemplateServiceServer {
	return &reportTemplateServiceServer{repo: repo}
}

func (s *reportTemplateServiceServer) GetReportTemplate(ctx context.Context, req *gen.GetReportTemplateRequest) (*gen.ReportTemplate, error) {
	id, err := idFromName(req.Name, "reportTemplates/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid report template name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "report template not found")
		}
		return nil, status.Error(codes.Internal, "failed to get report template")
	}
	return ReportTemplateToProto(m), nil
}

func (s *reportTemplateServiceServer) ListReportTemplates(ctx context.Context, req *gen.ListReportTemplatesRequest) (*gen.ListReportTemplatesResponse, error) {
	c, err := svcfilter.ParseReportTemplateFilter(req.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid page_token")
	}

	pageSize := int(req.PageSize)
	if pageSize <= 0 {
		pageSize = 20
	} else if pageSize > 100 {
		pageSize = 100
	}

	params := repository.ListReportTemplatesParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list report templates")
	}

	resp := &gen.ListReportTemplatesResponse{TotalSize: total}
	for _, m := range ms {
		resp.ReportTemplates = append(resp.ReportTemplates, ReportTemplateToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *reportTemplateServiceServer) CreateReportTemplate(ctx context.Context, req *gen.CreateReportTemplateRequest) (*gen.ReportTemplate, error) {
	if req.ReportTemplate == nil {
		return nil, status.Error(codes.InvalidArgument, "report_template is required")
	}
	m := &model.ReportTemplate{
		DisplayName: req.ReportTemplate.DisplayName,
		Template:    req.ReportTemplate.Template,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create report template")
	}
	return ReportTemplateToProto(m), nil
}

func (s *reportTemplateServiceServer) UpdateReportTemplate(ctx context.Context, req *gen.UpdateReportTemplateRequest) (*gen.ReportTemplate, error) {
	if req.ReportTemplate == nil {
		return nil, status.Error(codes.InvalidArgument, "report_template is required")
	}
	id, err := idFromName(req.ReportTemplate.Name, "reportTemplates/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid report template name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "report template not found")
		}
		return nil, status.Error(codes.Internal, "failed to get report template")
	}
	m.DisplayName = req.ReportTemplate.DisplayName
	m.Template = req.ReportTemplate.Template
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update report template")
	}
	return ReportTemplateToProto(m), nil
}

func (s *reportTemplateServiceServer) DeleteReportTemplate(ctx context.Context, req *gen.DeleteReportTemplateRequest) (*emptypb.Empty, error) {
	id, err := idFromName(req.Name, "reportTemplates/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid report template name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "report template not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete report template")
	}
	return &emptypb.Empty{}, nil
}
