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

type accountServiceServer struct {
	gen.UnimplementedAccountServiceServer
	repo *repository.AccountRepository
}

func newAccountServiceServer(repo *repository.AccountRepository) gen.AccountServiceServer {
	return &accountServiceServer{repo: repo}
}

func (s *accountServiceServer) GetAccount(ctx context.Context, req *gen.GetAccountRequest) (*gen.Account, error) {
	var n gen.AccountResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	id, err := uuid.Parse(n.Account)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		return nil, status.Error(codes.Internal, "failed to get account")
	}
	return AccountToProto(m), nil
}

func (s *accountServiceServer) ListAccounts(ctx context.Context, req *gen.ListAccountsRequest) (*gen.ListAccountsResponse, error) {
	c, err := svcfilter.ParseAccountFilter(req.Filter)
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
	orderExprs, _ := order.Resolve(orderBy, repository.AccountOrderFieldMapper)

	params := repository.ListAccountsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list accounts")
	}

	resp := &gen.ListAccountsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Accounts = append(resp.Accounts, AccountToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *accountServiceServer) ListNestedAccounts(ctx context.Context, req *gen.ListNestedAccountsRequest) (*gen.ListNestedAccountsResponse, error) {
	c, err := svcfilter.ParseAccountFilter(req.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
	}

	params := repository.ListAccountsParams{
		Page:     1,
		PageSize: 1000,
		Cond:     c,
	}

	ms, _, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list accounts")
	}

	return &gen.ListNestedAccountsResponse{
		Accounts: buildNestedTree(ms, uuid.NullUUID{}),
	}, nil
}

func (s *accountServiceServer) GetNestedAccount(ctx context.Context, req *gen.GetNestedAccountRequest) (*gen.GetNestedAccountResponse, error) {
	var n gen.AccountResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	id, err := uuid.Parse(n.Account)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}

	root, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		return nil, status.Error(codes.Internal, "failed to get account")
	}

	ms, _, err := s.repo.List(ctx, repository.ListAccountsParams{Page: 1, PageSize: 10000})
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list accounts")
	}

	nested := buildNestedTree(ms, uuid.NullUUID{Valid: true, UUID: root.ID})
	var rootNested *gen.NestedAccount
	if len(nested) > 0 {
		rootNested = nested[0]
	} else {
		rootNested = NestedAccountToProto(root)
	}
	return &gen.GetNestedAccountResponse{Account: rootNested}, nil
}

func (s *accountServiceServer) CreateAccount(ctx context.Context, req *gen.CreateAccountRequest) (*gen.Account, error) {
	if req.Account == nil {
		return nil, status.Error(codes.InvalidArgument, "account is required")
	}
	m := &model.Account{
		DisplayName:        req.Account.DisplayName,
		DisplayCode:        req.Account.DisplayCode,
		DisplayDescription: req.Account.DisplayDescription,
		IsContainer:        req.Account.IsContainer,
	}
	if req.Account.ParentAccount != "" {
		var pn gen.AccountResourceName
		if err := pn.UnmarshalString(req.Account.ParentAccount); err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid parent_account")
		}
		pid, err := uuid.Parse(pn.Account)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid parent_account")
		}
		m.ParentAccountID = uuid.NullUUID{Valid: true, UUID: pid}
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create account")
	}
	return AccountToProto(m), nil
}

func (s *accountServiceServer) UpdateAccount(ctx context.Context, req *gen.UpdateAccountRequest) (*gen.Account, error) {
	if req.Account == nil {
		return nil, status.Error(codes.InvalidArgument, "account is required")
	}
	var n gen.AccountResourceName
	if err := n.UnmarshalString(req.Account.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	id, err := uuid.Parse(n.Account)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		return nil, status.Error(codes.Internal, "failed to get account")
	}
	m.DisplayName = req.Account.DisplayName
	m.DisplayCode = req.Account.DisplayCode
	m.DisplayDescription = req.Account.DisplayDescription
	m.IsContainer = req.Account.IsContainer
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update account")
	}
	return AccountToProto(m), nil
}

func (s *accountServiceServer) ArchiveAccount(ctx context.Context, req *gen.ArchiveAccountRequest) (*gen.Account, error) {
	var n gen.AccountResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	id, err := uuid.Parse(n.Account)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		return nil, status.Error(codes.Internal, "failed to get account")
	}
	m.IsArchived = true
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to archive account")
	}
	return AccountToProto(m), nil
}

func (s *accountServiceServer) DeleteAccount(ctx context.Context, req *gen.DeleteAccountRequest) (*emptypb.Empty, error) {
	var n gen.AccountResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	id, err := uuid.Parse(n.Account)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete account")
	}
	return &emptypb.Empty{}, nil
}

// buildNestedTree recursively assembles NestedAccount trees.
// parentID selects which accounts to treat as roots (empty = top-level roots).
func buildNestedTree(all []*model.Account, parentID uuid.NullUUID) []*gen.NestedAccount {
	var result []*gen.NestedAccount
	for _, m := range all {
		if m.ParentAccountID == parentID {
			n := NestedAccountToProto(m)
			n.Children = buildNestedTree(all, uuid.NullUUID{Valid: true, UUID: m.ID})
			result = append(result, n)
		}
	}
	return result
}
