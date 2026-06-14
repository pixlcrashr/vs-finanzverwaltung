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
	errImportSourceRequired      = status.Error(codes.InvalidArgument, "import_source is required")
	errInvalidImportSourceName   = status.Error(codes.InvalidArgument, "invalid import source name")
	errImportSourceAlreadyExists = status.Error(codes.AlreadyExists, "import source with this ID already exists")
	errFailedGetImportSource     = status.Error(codes.Internal, "failed to get import source")
	errFailedListImportSources   = status.Error(codes.Internal, "failed to list import sources")
	errFailedCreateImportSource  = status.Error(codes.Internal, "failed to create import source")
	errFailedUpdateImportSource  = status.Error(codes.Internal, "failed to update import source")
	errFailedDeleteImportSource  = status.Error(codes.Internal, "failed to delete import source")
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
		return nil, errInvalidImportSourceName
	}
	id, err := uuid.Parse(n.ImportSource)
	if err != nil {
		return nil, errInvalidImportSourceName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errImportSourceNotFound
		}
		return nil, errFailedGetImportSource
	}
	return ImportSourceToProto(n.Organization, m), nil
}

func (s *importSourceServiceServer) ListImportSources(ctx context.Context, req *gen.ListImportSourcesRequest) (*gen.ListImportSourcesResponse, error) {
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParent
	}

	c, err := svcfilter.ParseImportSourceFilter(req.Filter)
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
		return nil, errFailedListImportSources
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
		return nil, errImportSourceRequired
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidParent
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
			return nil, errImportSourceAlreadyExists
		}
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedCreateImportSource
	}
	return ImportSourceToProto(n.Organization, m), nil
}

func (s *importSourceServiceServer) UpdateImportSource(ctx context.Context, req *gen.UpdateImportSourceRequest) (*gen.ImportSource, error) {
	if req.ImportSource == nil {
		return nil, errImportSourceRequired
	}
	var n gen.ImportSourceResourceName
	if err := n.UnmarshalString(req.ImportSource.Name); err != nil {
		return nil, errInvalidImportSourceName
	}
	id, err := uuid.Parse(n.ImportSource)
	if err != nil {
		return nil, errInvalidImportSourceName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errImportSourceNotFound
		}
		return nil, errFailedGetImportSource
	}
	m.DisplayName = req.ImportSource.DisplayName
	m.DisplayDescription = req.ImportSource.DisplayDescription
	if req.ImportSource.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(req.ImportSource.PeriodStart)
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedUpdateImportSource
	}
	return ImportSourceToProto(n.Organization, m), nil
}

func (s *importSourceServiceServer) DeleteImportSource(ctx context.Context, req *gen.DeleteImportSourceRequest) (*emptypb.Empty, error) {
	var n gen.ImportSourceResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidImportSourceName
	}
	id, err := uuid.Parse(n.ImportSource)
	if err != nil {
		return nil, errInvalidImportSourceName
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, errImportSourceNotFound
		}
		return nil, errFailedDeleteImportSource
	}
	return &emptypb.Empty{}, nil
}
