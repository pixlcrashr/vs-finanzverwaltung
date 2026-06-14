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
	errPeriodRequired            = status.Error(codes.InvalidArgument, "period is required")
	errInvalidPeriodName         = status.Error(codes.InvalidArgument, "invalid period name")
	errInvalidParentImportSource = status.Error(codes.InvalidArgument, "invalid parent import_source name")
	errPeriodNotFound            = status.Error(codes.NotFound, "period not found")
	errPeriodAlreadyExists       = status.Error(codes.AlreadyExists, "period with this ID already exists")
	errFailedGetPeriod           = status.Error(codes.Internal, "failed to get period")
	errFailedListPeriods         = status.Error(codes.Internal, "failed to list periods")
	errFailedCreatePeriod        = status.Error(codes.Internal, "failed to create period")
	errFailedClosePeriod         = status.Error(codes.Internal, "failed to close period")
	errFailedDeletePeriod        = status.Error(codes.Internal, "failed to delete period")
)

type importSourcePeriodServiceServer struct {
	gen.UnimplementedImportSourcePeriodServiceServer
	repo *repository.ImportSourcePeriodRepository
}

func newImportSourcePeriodServiceServer(repo *repository.ImportSourcePeriodRepository) gen.ImportSourcePeriodServiceServer {
	return &importSourcePeriodServiceServer{repo: repo}
}

func (s *importSourcePeriodServiceServer) GetImportSourcePeriod(ctx context.Context, req *gen.GetImportSourcePeriodRequest) (*gen.ImportSourcePeriod, error) {
	var n gen.ImportSourcePeriodResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidPeriodName
	}
	periodID, err := uuid.Parse(n.Period)
	if err != nil {
		return nil, errInvalidPeriodName
	}
	m, err := s.repo.GetByID(ctx, periodID)
	if err != nil {
		if isNotFound(err) {
			return nil, errPeriodNotFound
		}
		return nil, errFailedGetPeriod
	}
	return ImportSourcePeriodToProto(n.Organization, n.ImportSource, m), nil
}

func (s *importSourcePeriodServiceServer) ListImportSourcePeriods(ctx context.Context, req *gen.ListImportSourcePeriodsRequest) (*gen.ListImportSourcePeriodsResponse, error) {
	var pn gen.ImportSourceResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParentImportSource
	}
	srcID, err := uuid.Parse(pn.ImportSource)
	if err != nil {
		return nil, errInvalidParentImportSource
	}

	c, err := svcfilter.ParseImportSourcePeriodFilter(req.Filter)
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
	orderExprs, _ := order.Resolve(orderBy, repository.ImportSourcePeriodOrderFieldMapper)

	params := repository.ListImportSourcePeriodsParams{
		ImportSourceID: srcID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
		OrderBy:        orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListPeriods
	}

	resp := &gen.ListImportSourcePeriodsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Periods = append(resp.Periods, ImportSourcePeriodToProto(pn.Organization, pn.ImportSource, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *importSourcePeriodServiceServer) CreateImportSourcePeriod(ctx context.Context, req *gen.CreateImportSourcePeriodRequest) (*gen.ImportSourcePeriod, error) {
	var pn gen.ImportSourceResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParentImportSource
	}
	srcID, err := uuid.Parse(pn.ImportSource)
	if err != nil {
		return nil, errInvalidParentImportSource
	}
	if req.Period == nil {
		return nil, errPeriodRequired
	}
	m, err := s.repo.Create(ctx, repository.CreateImportSourcePeriodParams{
		ImportSourceID: srcID,
		Year:           int(req.Period.Year),
		IsClosed:       req.Period.IsClosed,
		CustomID:       req.ImportSourcePeriodId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrImportSourcePeriodAlreadyExists) {
			return nil, errPeriodAlreadyExists
		}
		if errors.Is(err, repository.ErrImportSourceNotFound) {
			return nil, errImportSourceNotFound
		}
		return nil, errFailedCreatePeriod
	}
	return ImportSourcePeriodToProto(pn.Organization, pn.ImportSource, m), nil
}

func (s *importSourcePeriodServiceServer) CloseImportSourcePeriod(ctx context.Context, req *gen.CloseImportSourcePeriodRequest) (*gen.ImportSourcePeriod, error) {
	var n gen.ImportSourcePeriodResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidPeriodName
	}
	periodID, err := uuid.Parse(n.Period)
	if err != nil {
		return nil, errInvalidPeriodName
	}
	m, err := s.repo.GetByID(ctx, periodID)
	if err != nil {
		if isNotFound(err) {
			return nil, errPeriodNotFound
		}
		return nil, errFailedGetPeriod
	}
	m.IsClosed = true
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedClosePeriod
	}
	return ImportSourcePeriodToProto(n.Organization, n.ImportSource, m), nil
}

func (s *importSourcePeriodServiceServer) DeleteImportSourcePeriod(ctx context.Context, req *gen.DeleteImportSourcePeriodRequest) (*emptypb.Empty, error) {
	var n gen.ImportSourcePeriodResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidPeriodName
	}
	periodID, err := uuid.Parse(n.Period)
	if err != nil {
		return nil, errInvalidPeriodName
	}
	if err := s.repo.Delete(ctx, periodID); err != nil {
		if isNotFound(err) {
			return nil, errPeriodNotFound
		}
		return nil, errFailedDeletePeriod
	}
	return &emptypb.Empty{}, nil
}
