package services

import (
	"context"

	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type importSourceServiceServer struct {
	gen.UnimplementedImportSourceServiceServer
	repo *repository.ImportSourceRepository
}

func newImportSourceServiceServer(repo *repository.ImportSourceRepository) gen.ImportSourceServiceServer {
	return &importSourceServiceServer{repo: repo}
}

func (s *importSourceServiceServer) GetImportSource(ctx context.Context, req *gen.GetImportSourceRequest) (*gen.ImportSource, error) {
	id, err := idFromName(req.Name, "importSources/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid import source name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "import source not found")
		}
		return nil, status.Error(codes.Internal, "failed to get import source")
	}
	return ImportSourceToProto(m), nil
}

func (s *importSourceServiceServer) ListImportSources(ctx context.Context, req *gen.ListImportSourcesRequest) (*gen.ListImportSourcesResponse, error) {
	c, err := svcfilter.ParseImportSourceFilter(req.Filter)
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

	// Parse order_by
	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
	}
	orderExprs, _ := order.Resolve(orderBy, repository.ImportSourceOrderFieldMapper)

	params := repository.ListImportSourcesParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list import sources")
	}

	resp := &gen.ListImportSourcesResponse{TotalSize: total}
	for _, m := range ms {
		resp.ImportSources = append(resp.ImportSources, ImportSourceToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *importSourceServiceServer) CreateImportSource(ctx context.Context, req *gen.CreateImportSourceRequest) (*gen.ImportSource, error) {
	if req.ImportSource == nil {
		return nil, status.Error(codes.InvalidArgument, "import_source is required")
	}
	m := &model.ImportSource{
		DisplayName:        req.ImportSource.DisplayName,
		DisplayDescription: req.ImportSource.DisplayDescription,
	}
	if req.ImportSource.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(req.ImportSource.PeriodStart)
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create import source")
	}
	return ImportSourceToProto(m), nil
}

func (s *importSourceServiceServer) UpdateImportSource(ctx context.Context, req *gen.UpdateImportSourceRequest) (*gen.ImportSource, error) {
	if req.ImportSource == nil {
		return nil, status.Error(codes.InvalidArgument, "import_source is required")
	}
	id, err := idFromName(req.ImportSource.Name, "importSources/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid import source name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "import source not found")
		}
		return nil, status.Error(codes.Internal, "failed to get import source")
	}
	m.DisplayName = req.ImportSource.DisplayName
	m.DisplayDescription = req.ImportSource.DisplayDescription
	if req.ImportSource.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(req.ImportSource.PeriodStart)
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update import source")
	}
	return ImportSourceToProto(m), nil
}

func (s *importSourceServiceServer) DeleteImportSource(ctx context.Context, req *gen.DeleteImportSourceRequest) (*emptypb.Empty, error) {
	id, err := idFromName(req.Name, "importSources/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid import source name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "import source not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete import source")
	}
	return &emptypb.Empty{}, nil
}
