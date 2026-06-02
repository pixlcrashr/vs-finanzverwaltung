package services

import (
	"context"

	"github.com/google/uuid"
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
		return nil, status.Error(codes.InvalidArgument, "invalid organization name")
	}
	id, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "organization not found")
		}
		return nil, status.Error(codes.Internal, "failed to get organization")
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
		return nil, status.Error(codes.InvalidArgument, "invalid page_token")
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
		return nil, status.Error(codes.Internal, "failed to list organizations")
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
		return nil, status.Error(codes.InvalidArgument, "organization is required")
	}
	m := &model.Organization{
		DisplayName: req.Organization.DisplayName,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create organization")
	}
	return OrganizationToProto(m), nil
}

func (s *organizationServiceServer) UpdateOrganization(ctx context.Context, req *gen.UpdateOrganizationRequest) (*gen.Organization, error) {
	if req.Organization == nil {
		return nil, status.Error(codes.InvalidArgument, "organization is required")
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Organization.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization name")
	}
	id, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "organization not found")
		}
		return nil, status.Error(codes.Internal, "failed to get organization")
	}
	m.DisplayName = req.Organization.DisplayName
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update organization")
	}
	return OrganizationToProto(m), nil
}

func (s *organizationServiceServer) DeleteOrganization(ctx context.Context, req *gen.DeleteOrganizationRequest) (*emptypb.Empty, error) {
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization name")
	}
	id, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "organization not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete organization")
	}
	return &emptypb.Empty{}, nil
}
