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

type accountGroupServiceServer struct {
	gen.UnimplementedAccountGroupServiceServer
	repo *repository.AccountGroupRepository
}

func newAccountGroupServiceServer(repo *repository.AccountGroupRepository) gen.AccountGroupServiceServer {
	return &accountGroupServiceServer{repo: repo}
}

func (s *accountGroupServiceServer) GetAccountGroup(ctx context.Context, req *gen.GetAccountGroupRequest) (*gen.AccountGroup, error) {
	id, err := idFromName(req.Name, "accountGroups/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_group name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account group not found")
		}
		return nil, status.Error(codes.Internal, "failed to get account group")
	}
	return AccountGroupToProto(m), nil
}

func (s *accountGroupServiceServer) ListAccountGroups(ctx context.Context, req *gen.ListAccountGroupsRequest) (*gen.ListAccountGroupsResponse, error) {
	c, err := svcfilter.ParseAccountGroupFilter(req.Filter)
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
	orderExprs, _ := order.Resolve(orderBy, repository.AccountGroupOrderFieldMapper)

	params := repository.ListAccountGroupsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list account groups")
	}

	resp := &gen.ListAccountGroupsResponse{TotalSize: total}
	for _, m := range ms {
		resp.AccountGroups = append(resp.AccountGroups, AccountGroupToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *accountGroupServiceServer) CreateAccountGroup(ctx context.Context, req *gen.CreateAccountGroupRequest) (*gen.AccountGroup, error) {
	if req.AccountGroup == nil {
		return nil, status.Error(codes.InvalidArgument, "account_group is required")
	}
	m := &model.AccountGroup{
		DisplayName:        req.AccountGroup.DisplayName,
		DisplayDescription: req.AccountGroup.DisplayDescription,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create account group")
	}
	return AccountGroupToProto(m), nil
}

func (s *accountGroupServiceServer) UpdateAccountGroup(ctx context.Context, req *gen.UpdateAccountGroupRequest) (*gen.AccountGroup, error) {
	if req.AccountGroup == nil {
		return nil, status.Error(codes.InvalidArgument, "account_group is required")
	}
	id, err := idFromName(req.AccountGroup.Name, "accountGroups/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_group name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account group not found")
		}
		return nil, status.Error(codes.Internal, "failed to get account group")
	}
	m.DisplayName = req.AccountGroup.DisplayName
	m.DisplayDescription = req.AccountGroup.DisplayDescription
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update account group")
	}
	return AccountGroupToProto(m), nil
}

func (s *accountGroupServiceServer) DeleteAccountGroup(ctx context.Context, req *gen.DeleteAccountGroupRequest) (*emptypb.Empty, error) {
	id, err := idFromName(req.Name, "accountGroups/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_group name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account group not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete account group")
	}
	return &emptypb.Empty{}, nil
}
