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
	statusImportSourceRequired      = status.New(codes.InvalidArgument, "import_source is required")
	statusInvalidImportSourceName   = status.New(codes.InvalidArgument, "invalid import source name")
	statusImportSourceAlreadyExists = status.New(codes.AlreadyExists, "import source with this ID already exists")
	statusFailedGetImportSource     = status.New(codes.Internal, "failed to get import source")
	statusFailedListImportSources   = status.New(codes.Internal, "failed to list import sources")
	statusFailedCreateImportSource  = status.New(codes.Internal, "failed to create import source")
	statusFailedUpdateImportSource  = status.New(codes.Internal, "failed to update import source")
	statusFailedDeleteImportSource  = status.New(codes.Internal, "failed to delete import source")
)

type importSourceServiceServer struct {
	gen.UnimplementedImportSourceServiceServer
	repo *repository.ImportSourceRepository
}

func newImportSourceServiceServer(repo *repository.ImportSourceRepository) gen.ImportSourceServiceServer {
	return &importSourceServiceServer{repo: repo}
}

func (s *importSourceServiceServer) GetImportSource(ctx context.Context, req *gen.GetImportSourceRequest) (*gen.ImportSource, error) {
	var n gen.ImportSourceResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceName}
	}

	id, err := uuid.Parse(n.ImportSource)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrImportSourceNotFound) {
			return nil, &ServerError{Err: err, Status: statusImportSourceNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetImportSource}
	}

	return ImportSourceToProto(n.Organization, m), nil
}

func (s *importSourceServiceServer) ListImportSources(ctx context.Context, req *gen.ListImportSourcesRequest) (*gen.ListImportSourcesResponse, error) {
	var pn gen.OrganizationResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	c, err := svcfilter.ParseImportSourceFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidPageToken}
	}

	pageSize := normalizePageSize(req.PageSize)

	// Parse order_by
	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrderBy}
	}

	orderExprs, _ := order.Resolve(orderBy, repository.ImportSourceOrderFieldMapper)

	_ = orgID // used via pn.Organization in mapper calls below
	params := repository.ListImportSourcesParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListImportSources}
	}

	resp := &gen.ListImportSourcesResponse{TotalSize: total}
	for _, m := range ms {
		resp.ImportSources = append(resp.ImportSources, ImportSourceToProto(pn.Organization, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *importSourceServiceServer) CreateImportSource(ctx context.Context, req *gen.CreateImportSourceRequest) (*gen.ImportSource, error) {
	if req.ImportSource == nil {
		return nil, &ServerError{Status: statusImportSourceRequired}
	}

	var n gen.OrganizationResourceName

	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	params := repository.CreateImportSourceParams{
		OrganizationID:     orgID,
		DisplayName:        req.ImportSource.DisplayName,
		DisplayDescription: req.ImportSource.DisplayDescription,
		CustomID:           req.ImportSourceId,
	}
	if req.ImportSource.PeriodStart != nil {
		params.PeriodStart = protoDateToTime(req.ImportSource.PeriodStart)
	}

	m, err := s.repo.Create(ctx, params)
	if err != nil {
		if errors.Is(err, repository.ErrImportSourceAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusImportSourceAlreadyExists}
		}

		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, &ServerError{Err: err, Status: statusOrganizationNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateImportSource}
	}

	return ImportSourceToProto(n.Organization, m), nil
}

func (s *importSourceServiceServer) UpdateImportSource(ctx context.Context, req *gen.UpdateImportSourceRequest) (*gen.ImportSource, error) {
	if req.ImportSource == nil {
		return nil, &ServerError{Status: statusImportSourceRequired}
	}

	var n gen.ImportSourceResourceName

	if err := n.UnmarshalString(req.ImportSource.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceName}
	}

	id, err := uuid.Parse(n.ImportSource)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrImportSourceNotFound) {
			return nil, &ServerError{Err: err, Status: statusImportSourceNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetImportSource}
	}

	m.DisplayName = req.ImportSource.DisplayName
	m.DisplayDescription = req.ImportSource.DisplayDescription

	if req.ImportSource.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(req.ImportSource.PeriodStart)
	}

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateImportSource}
	}

	return ImportSourceToProto(n.Organization, m), nil
}

func (s *importSourceServiceServer) DeleteImportSource(ctx context.Context, req *gen.DeleteImportSourceRequest) (*emptypb.Empty, error) {
	var n gen.ImportSourceResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceName}
	}

	id, err := uuid.Parse(n.ImportSource)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceName}
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		if errors.Is(err, repository.ErrImportSourceNotFound) {
			return nil, &ServerError{Err: err, Status: statusImportSourceNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteImportSource}
	}

	return &emptypb.Empty{}, nil
}
