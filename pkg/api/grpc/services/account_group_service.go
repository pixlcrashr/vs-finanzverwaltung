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
	"github.com/theater-improrama/go-utils/optional"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

var (
	statusAccountGroupRequired                  = status.New(codes.InvalidArgument, "account_group is required")
	statusInvalidAccountGroupName               = status.New(codes.InvalidArgument, "invalid account_group name")
	statusInvalidOrganizationInAccountGroupName = status.New(codes.InvalidArgument, "invalid organization in account_group name")
	statusAccountGroupAlreadyExists             = status.New(codes.AlreadyExists, "account group with this ID already exists")
	statusFailedGetAccountGroup                 = status.New(codes.Internal, "failed to get account group")
	statusFailedListAccountGroups               = status.New(codes.Internal, "failed to list account groups")
	statusFailedCreateAccountGroup              = status.New(codes.Internal, "failed to create account group")
	statusFailedUpdateAccountGroup              = status.New(codes.Internal, "failed to update account group")
	statusFailedDeleteAccountGroup              = status.New(codes.Internal, "failed to delete account group")
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
		return nil, &ServerError{Err: err, Status: statusInvalidAccountGroupName}
	}

	m, err := s.repo.GetByResourceName(ctx, n.Organization, n.AccountGroup)
	if err != nil {
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, &ServerError{Err: err, Status: statusOrganizationNotFound}
		}

		if errors.Is(err, repository.ErrAccountGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountGroupNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccountGroup}
	}

	return AccountGroupToProto(n.Organization, m), nil
}

func (s *accountGroupServiceServer) ListAccountGroups(ctx context.Context, req *gen.ListAccountGroupsRequest) (*gen.ListAccountGroupsResponse, error) {
	var orgN gen.OrganizationResourceName

	if err := orgN.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(orgN.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	c, err := svcfilter.ParseAccountGroupFilter(req.Filter)
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
		return nil, &ServerError{Err: err, Status: statusFailedListAccountGroups}
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
		return nil, &ServerError{Status: statusAccountGroupRequired}
	}

	var pn gen.OrganizationResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	m, err := s.repo.Create(ctx, repository.CreateAccountGroupParams{
		OrganizationID:     orgID,
		DisplayName:        req.AccountGroup.DisplayName,
		DisplayDescription: req.AccountGroup.DisplayDescription,
		CustomID:           req.AccountGroupId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusAccountGroupAlreadyExists}
		}

		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, &ServerError{Err: err, Status: statusOrganizationNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateAccountGroup}
	}

	return AccountGroupToProto(pn.Organization, m), nil
}

func (s *accountGroupServiceServer) UpdateAccountGroup(ctx context.Context, req *gen.UpdateAccountGroupRequest) (*gen.AccountGroup, error) {
	if req.AccountGroup == nil {
		return nil, &ServerError{Status: statusAccountGroupRequired}
	}

	var n gen.AccountGroupResourceName

	if err := n.UnmarshalString(req.AccountGroup.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountGroupName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountGroupName}
	}

	// Use CustomID (n.AccountGroup) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.AccountGroup)
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountGroupNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccountGroup}
	}

	updateParams := repository.UpdateAccountGroupParams{
		DisplayName:        optional.From(req.AccountGroup.DisplayName),
		DisplayDescription: optional.From(req.AccountGroup.DisplayDescription),
	}

	if err := s.repo.Update(ctx, m.ID, updateParams); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateAccountGroup}
	}

	// Refresh the model after update
	m, err = s.repo.GetByID(ctx, m.ID)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateAccountGroup}
	}

	return AccountGroupToProto(n.Organization, m), nil
}

func (s *accountGroupServiceServer) DeleteAccountGroup(ctx context.Context, req *gen.DeleteAccountGroupRequest) (*emptypb.Empty, error) {
	var n gen.AccountGroupResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountGroupName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountGroupName}
	}

	// Use CustomID (n.AccountGroup) to find the group, then delete by actual ID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.AccountGroup)
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountGroupNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccountGroup}
	}

	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if errors.Is(err, repository.ErrAccountGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountGroupNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteAccountGroup}
	}

	return &emptypb.Empty{}, nil
}
