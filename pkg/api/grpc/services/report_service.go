package services

import (
	"context"

	"errors"

	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"

	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

var (
	errReportRequired      = status.Error(codes.InvalidArgument, "report is required")
	errInvalidReportName   = status.Error(codes.InvalidArgument, "invalid report name")
	errReportNotFound      = status.Error(codes.NotFound, "report not found")
	errReportAlreadyExists = status.Error(codes.AlreadyExists, "report with this ID already exists")
	errFailedGetReport     = status.Error(codes.Internal, "failed to get report")
	errFailedListReports   = status.Error(codes.Internal, "failed to list reports")
	errFailedCreateReport  = status.Error(codes.Internal, "failed to create report")
	errFailedDeleteReport  = status.Error(codes.Internal, "failed to delete report")
)

type reportServiceServer struct {
	gen.UnimplementedReportServiceServer
	repo *repository.ReportRepository
}

func newReportServiceServer(repo *repository.ReportRepository) gen.ReportServiceServer {
	return &reportServiceServer{repo: repo}
}

func (s *reportServiceServer) GetReport(ctx context.Context, req *gen.GetReportRequest) (*gen.Report, error) {
	var n gen.ReportResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidReportName
	}
	id, err := uuid.Parse(n.Report)
	if err != nil {
		return nil, errInvalidReportName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errReportNotFound
		}
		return nil, errFailedGetReport
	}
	return ReportToProto(n.Organization, n.Report, m), nil
}

func (s *reportServiceServer) ListReports(ctx context.Context, req *gen.ListReportsRequest) (*gen.ListReportsResponse, error) {
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}

	c, err := svcfilter.ParseReportFilter(req.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, errInvalidPageToken
	}

	pageSize := int(req.PageSize)
	if pageSize <= 0 {
		pageSize = 20
	} else if pageSize > 100 {
		pageSize = 100
	}

	// Parse order_by
	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
	}
	orderExprs, _ := order.Resolve(orderBy, repository.ReportOrderFieldMapper)

	params := repository.ListReportsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListReports
	}

	resp := &gen.ListReportsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Reports = append(resp.Reports, ReportToProto(pn.Organization, m.CustomID, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *reportServiceServer) CreateReport(ctx context.Context, req *gen.CreateReportRequest) (*gen.Report, error) {
	if req.Report == nil {
		return nil, errReportRequired
	}
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParent
	}
	m, err := s.repo.Create(ctx, repository.CreateReportParams{
		OrganizationID: orgID,
		DisplayName:    req.Report.DisplayName,
		CustomID:       req.ReportId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrReportAlreadyExists) {
			return nil, errReportAlreadyExists
		}
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedCreateReport
	}
	return ReportToProto(pn.Organization, req.ReportId, m), nil
}

func (s *reportServiceServer) DeleteReport(ctx context.Context, req *gen.DeleteReportRequest) (*emptypb.Empty, error) {
	var n gen.ReportResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidReportName
	}
	id, err := uuid.Parse(n.Report)
	if err != nil {
		return nil, errInvalidReportName
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, errReportNotFound
		}
		return nil, errFailedDeleteReport
	}
	return &emptypb.Empty{}, nil
}
