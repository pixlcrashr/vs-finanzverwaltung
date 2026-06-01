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

type importSourcePeriodServiceServer struct {
	gen.UnimplementedImportSourcePeriodServiceServer
	repo *repository.ImportSourcePeriodRepository
}

func newImportSourcePeriodServiceServer(repo *repository.ImportSourcePeriodRepository) gen.ImportSourcePeriodServiceServer {
	return &importSourcePeriodServiceServer{repo: repo}
}

func (s *importSourcePeriodServiceServer) GetImportSourcePeriod(ctx context.Context, req *gen.GetImportSourcePeriodRequest) (*gen.ImportSourcePeriod, error) {
	periodID, err := lastSegment(req.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid period name")
	}
	m, err := s.repo.GetByID(ctx, periodID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "period not found")
		}
		return nil, status.Error(codes.Internal, "failed to get period")
	}
	return ImportSourcePeriodToProto(m), nil
}

func (s *importSourcePeriodServiceServer) ListImportSourcePeriods(ctx context.Context, req *gen.ListImportSourcePeriodsRequest) (*gen.ListImportSourcePeriodsResponse, error) {
	srcID, err := idFromName(req.Parent, "importSources/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent import_source name")
	}

	c, err := svcfilter.ParseImportSourcePeriodFilter(req.Filter)
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

	params := repository.ListImportSourcePeriodsParams{
		ImportSourceID: srcID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list periods")
	}

	resp := &gen.ListImportSourcePeriodsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Periods = append(resp.Periods, ImportSourcePeriodToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *importSourcePeriodServiceServer) CreateImportSourcePeriod(ctx context.Context, req *gen.CreateImportSourcePeriodRequest) (*gen.ImportSourcePeriod, error) {
	srcID, err := idFromName(req.Parent, "importSources/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent import_source name")
	}
	if req.Period == nil {
		return nil, status.Error(codes.InvalidArgument, "period is required")
	}
	m := &model.ImportSourcePeriod{
		ImportSourceID: srcID,
		Year:           int(req.Period.Year),
		IsClosed:       req.Period.IsClosed,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create period")
	}
	return ImportSourcePeriodToProto(m), nil
}

func (s *importSourcePeriodServiceServer) CloseImportSourcePeriod(ctx context.Context, req *gen.CloseImportSourcePeriodRequest) (*gen.ImportSourcePeriod, error) {
	periodID, err := lastSegment(req.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid period name")
	}
	m, err := s.repo.GetByID(ctx, periodID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "period not found")
		}
		return nil, status.Error(codes.Internal, "failed to get period")
	}
	m.IsClosed = true
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to close period")
	}
	return ImportSourcePeriodToProto(m), nil
}

func (s *importSourcePeriodServiceServer) DeleteImportSourcePeriod(ctx context.Context, req *gen.DeleteImportSourcePeriodRequest) (*emptypb.Empty, error) {
	periodID, err := lastSegment(req.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid period name")
	}
	if err := s.repo.Delete(ctx, periodID); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "period not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete period")
	}
	return &emptypb.Empty{}, nil
}
