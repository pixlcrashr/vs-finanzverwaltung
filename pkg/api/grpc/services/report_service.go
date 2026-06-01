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

type reportServiceServer struct {
	gen.UnimplementedReportServiceServer
	repo *repository.ReportRepository
}

func newReportServiceServer(repo *repository.ReportRepository) gen.ReportServiceServer {
	return &reportServiceServer{repo: repo}
}

func (s *reportServiceServer) GetReport(ctx context.Context, req *gen.GetReportRequest) (*gen.Report, error) {
	id, err := idFromName(req.Name, "reports/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid report name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "report not found")
		}
		return nil, status.Error(codes.Internal, "failed to get report")
	}
	return ReportToProto(m), nil
}

func (s *reportServiceServer) ListReports(ctx context.Context, req *gen.ListReportsRequest) (*gen.ListReportsResponse, error) {
	c, err := svcfilter.ParseReportFilter(req.Filter)
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

	params := repository.ListReportsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list reports")
	}

	resp := &gen.ListReportsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Reports = append(resp.Reports, ReportToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *reportServiceServer) CreateReport(ctx context.Context, req *gen.CreateReportRequest) (*gen.Report, error) {
	if req.Report == nil {
		return nil, status.Error(codes.InvalidArgument, "report is required")
	}
	m := &model.Report{
		DisplayName: req.Report.DisplayName,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create report")
	}
	return ReportToProto(m), nil
}

func (s *reportServiceServer) DeleteReport(ctx context.Context, req *gen.DeleteReportRequest) (*emptypb.Empty, error) {
	id, err := idFromName(req.Name, "reports/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid report name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "report not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete report")
	}
	return &emptypb.Empty{}, nil
}
