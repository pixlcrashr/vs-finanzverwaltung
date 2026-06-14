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
	errAccountGroupRequired                  = status.Error(codes.InvalidArgument, "account_group is required")
	errInvalidAccountGroupName               = status.Error(codes.InvalidArgument, "invalid account_group name")
	errInvalidOrganizationInAccountGroupName = status.Error(codes.InvalidArgument, "invalid organization in account_group name")
	errAccountGroupAlreadyExists             = status.Error(codes.AlreadyExists, "account group with this ID already exists")
	errFailedGetAccountGroup                 = status.Error(codes.Internal, "failed to get account group")
	errFailedListAccountGroups               = status.Error(codes.Internal, "failed to list account groups")
	errFailedCreateAccountGroup              = status.Error(codes.Internal, "failed to create account group")
	errFailedUpdateAccountGroup              = status.Error(codes.Internal, "failed to update account group")
	errFailedDeleteAccountGroup              = status.Error(codes.Internal, "failed to delete account group")
)

type accountGroupServiceServer struct {
	gen.UnimplementedAccountGroupServiceServer
	repo *repository.AccountGroupRepository
}

func newAccountGroupServiceServer(repo *repository.AccountGroupRepository) gen.AccountGroupServiceServer {
	return &accountGroupServiceServer{repo: repo}
}

func (s *accountGroupServiceServer) GetAccountGroup(ctx context.Context, req *gen.GetAccountGroupRequest) (*gen.AccountGroup, error) {
	var n gen.AccountGroupResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidAccountGroupName
	}

	m, err := s.repo.GetByResourceName(ctx, n.Organization, n.AccountGroup)
	if err != nil {
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, errOrganizationNotFound
		}

		if errors.Is(err, repository.ErrAccountGroupNotFound) {
			return nil, errAccountGroupNotFound
		}

		return nil, errFailedGetAccountGroup
	}

	return AccountGroupToProto(n.Organization, m), nil
}

func (s *accountGroupServiceServer) ListAccountGroups(ctx context.Context, req *gen.ListAccountGroupsRequest) (*gen.ListAccountGroupsResponse, error) {
	var orgN gen.OrganizationResourceName
	if err := orgN.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(orgN.Organization)
	if err != nil {
		return nil, errInvalidParent
	}

	c, err := svcfilter.ParseAccountGroupFilter(req.Filter)
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
	orderExprs, _ := order.Resolve(orderBy, repository.AccountGroupOrderFieldMapper)

	params := repository.ListAccountGroupsParams{
		OrganizationID: orgID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
		OrderBy:        orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListAccountGroups
	}

	resp := &gen.ListAccountGroupsResponse{TotalSize: total}
	for _, m := range ms {
		resp.AccountGroups = append(resp.AccountGroups, AccountGroupToProto(orgN.Organization, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *accountGroupServiceServer) CreateAccountGroup(ctx context.Context, req *gen.CreateAccountGroupRequest) (*gen.AccountGroup, error) {
	if req.AccountGroup == nil {
		return nil, errAccountGroupRequired
	}
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParent
	}
	m, err := s.repo.Create(ctx, repository.CreateAccountGroupParams{
		OrganizationID:     orgID,
		DisplayName:        req.AccountGroup.DisplayName,
		DisplayDescription: req.AccountGroup.DisplayDescription,
		CustomID:           req.AccountGroupId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupAlreadyExists) {
			return nil, errAccountGroupAlreadyExists
		}
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedCreateAccountGroup
	}
	return AccountGroupToProto(pn.Organization, m), nil
}

func (s *accountGroupServiceServer) UpdateAccountGroup(ctx context.Context, req *gen.UpdateAccountGroupRequest) (*gen.AccountGroup, error) {
	if req.AccountGroup == nil {
		return nil, errAccountGroupRequired
	}
	var n gen.AccountGroupResourceName
	if err := n.UnmarshalString(req.AccountGroup.Name); err != nil {
		return nil, errInvalidAccountGroupName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInAccountGroupName
	}
	// Use CustomID (n.AccountGroup) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.AccountGroup)
	if err != nil {
		if isNotFound(err) {
			return nil, errAccountGroupNotFound
		}
		return nil, errFailedGetAccountGroup
	}
	m.DisplayName = req.AccountGroup.DisplayName
	m.DisplayDescription = req.AccountGroup.DisplayDescription
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedUpdateAccountGroup
	}
	return AccountGroupToProto(n.Organization, m), nil
}

func (s *accountGroupServiceServer) DeleteAccountGroup(ctx context.Context, req *gen.DeleteAccountGroupRequest) (*emptypb.Empty, error) {
	var n gen.AccountGroupResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidAccountGroupName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInAccountGroupName
	}
	// Use CustomID (n.AccountGroup) to find the group, then delete by actual ID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.AccountGroup)
	if err != nil {
		if isNotFound(err) {
			return nil, errAccountGroupNotFound
		}
		return nil, errFailedGetAccountGroup
	}
	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if isNotFound(err) {
			return nil, errAccountGroupNotFound
		}
		return nil, errFailedDeleteAccountGroup
	}
	return &emptypb.Empty{}, nil
}
