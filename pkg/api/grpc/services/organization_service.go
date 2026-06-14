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
	errOrganizationRequired      = status.Error(codes.InvalidArgument, "organization is required")
	errInvalidOrganizationName   = status.Error(codes.InvalidArgument, "invalid organization name")
	errOrganizationIDRequired    = status.Error(codes.InvalidArgument, "organization_id is required")
	errOrganizationAlreadyExists = status.Error(codes.AlreadyExists, "organization with this ID already exists")
	errFailedGetOrganization     = status.Error(codes.Internal, "failed to get organization")
	errFailedListOrganizations   = status.Error(codes.Internal, "failed to list organizations")
	errFailedCreateOrganization  = status.Error(codes.Internal, "failed to create organization")
	errFailedUpdateOrganization  = status.Error(codes.Internal, "failed to update organization")
	errFailedDeleteOrganization  = status.Error(codes.Internal, "failed to delete organization")
	errFailedCheckOrganization   = status.Error(codes.Internal, "failed to check organization id")
)

type organizationServiceServer struct {
	gen.UnimplementedOrganizationServiceServer
	repo *repository.OrganizationRepository
}

func newOrganizationServiceServer(repo *repository.OrganizationRepository) gen.OrganizationServiceServer {
	return &organizationServiceServer{repo: repo}
}

func (s *organizationServiceServer) GetOrganization(ctx context.Context, req *gen.GetOrganizationRequest) (*gen.Organization, error) {
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidOrganizationName
	}

	m, err := s.repo.GetByResourceName(ctx, n.Organization)
	if err != nil {
		if isNotFound(err) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedGetOrganization
	}

	return OrganizationToProto(m), nil
}

func (s *organizationServiceServer) ListOrganizations(ctx context.Context, req *gen.ListOrganizationsRequest) (*gen.ListOrganizationsResponse, error) {
	c, err := svcfilter.ParseOrganizationFilter(req.Filter)
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

	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
	}
	orderExprs, _ := order.Resolve(orderBy, repository.OrganizationOrderFieldMapper)

	params := repository.ListOrganizationsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListOrganizations
	}

	resp := &gen.ListOrganizationsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Organizations = append(resp.Organizations, OrganizationToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *organizationServiceServer) CreateOrganization(ctx context.Context, req *gen.CreateOrganizationRequest) (*gen.Organization, error) {
	if req.Organization == nil {
		return nil, errOrganizationRequired
	}
	m, err := s.repo.Create(ctx, repository.CreateOrganizationParams{
		DisplayName: req.Organization.DisplayName,
		CustomID:    req.OrganizationId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrOrganizationAlreadyExists) {
			return nil, errOrganizationAlreadyExists
		}
		return nil, errFailedCreateOrganization
	}
	return OrganizationToProto(m), nil
}

func (s *organizationServiceServer) UpdateOrganization(ctx context.Context, req *gen.UpdateOrganizationRequest) (*gen.Organization, error) {
	if req.Organization == nil {
		return nil, errOrganizationRequired
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Organization.Name); err != nil {
		return nil, errInvalidOrganizationName
	}
	id, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedGetOrganization
	}
	m.DisplayName = req.Organization.DisplayName
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedUpdateOrganization
	}
	return OrganizationToProto(m), nil
}

func (s *organizationServiceServer) CheckOrganizationId(ctx context.Context, req *gen.CheckOrganizationIdRequest) (*gen.CheckOrganizationIdResponse, error) {
	if req.OrganizationId == "" {
		return nil, errOrganizationIDRequired
	}
	exists, err := s.repo.ExistsByCustomID(ctx, req.OrganizationId)
	if err != nil {
		return nil, errFailedCheckOrganization
	}
	return &gen.CheckOrganizationIdResponse{Available: !exists}, nil
}

func (s *organizationServiceServer) DeleteOrganization(ctx context.Context, req *gen.DeleteOrganizationRequest) (*emptypb.Empty, error) {
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidOrganizationName
	}
	id, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationName
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedDeleteOrganization
	}
	return &emptypb.Empty{}, nil
}
