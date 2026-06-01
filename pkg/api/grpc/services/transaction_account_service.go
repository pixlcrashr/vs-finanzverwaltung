package services

import (
	"context"

	"github.com/google/uuid"
	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type transactionAccountServiceServer struct {
	gen.UnimplementedTransactionAccountServiceServer
	repo *repository.TransactionAccountRepository
}

func newTransactionAccountServiceServer(repo *repository.TransactionAccountRepository) gen.TransactionAccountServiceServer {
	return &transactionAccountServiceServer{repo: repo}
}

func (s *transactionAccountServiceServer) GetTransactionAccount(ctx context.Context, req *gen.GetTransactionAccountRequest) (*gen.TransactionAccount, error) {
	id, err := idFromName(req.Name, "transactionAccounts/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid transaction account name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "transaction account not found")
		}
		return nil, status.Error(codes.Internal, "failed to get transaction account")
	}
	return TransactionAccountToProto(m), nil
}

func (s *transactionAccountServiceServer) ListTransactionAccounts(ctx context.Context, req *gen.ListTransactionAccountsRequest) (*gen.ListTransactionAccountsResponse, error) {
	c, err := svcfilter.ParseTransactionAccountFilter(req.Filter)
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

	params := repository.ListTransactionAccountsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list transaction accounts")
	}

	resp := &gen.ListTransactionAccountsResponse{TotalSize: total}
	for _, m := range ms {
		resp.TransactionAccounts = append(resp.TransactionAccounts, TransactionAccountToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *transactionAccountServiceServer) CreateTransactionAccount(ctx context.Context, req *gen.CreateTransactionAccountRequest) (*gen.TransactionAccount, error) {
	if req.TransactionAccount == nil {
		return nil, status.Error(codes.InvalidArgument, "transaction_account is required")
	}
	srcID, err := uuid.Parse(req.TransactionAccount.ImportSourceId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid import_source_id")
	}
	m := &model.TransactionAccount{
		Code:               req.TransactionAccount.Code,
		ImportSourceID:     srcID,
		DisplayName:        req.TransactionAccount.DisplayName,
		DisplayDescription: req.TransactionAccount.DisplayDescription,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create transaction account")
	}
	return TransactionAccountToProto(m), nil
}

func (s *transactionAccountServiceServer) UpdateTransactionAccount(ctx context.Context, req *gen.UpdateTransactionAccountRequest) (*gen.TransactionAccount, error) {
	if req.TransactionAccount == nil {
		return nil, status.Error(codes.InvalidArgument, "transaction_account is required")
	}
	id, err := idFromName(req.TransactionAccount.Name, "transactionAccounts/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid transaction account name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "transaction account not found")
		}
		return nil, status.Error(codes.Internal, "failed to get transaction account")
	}
	m.Code = req.TransactionAccount.Code
	m.DisplayName = req.TransactionAccount.DisplayName
	m.DisplayDescription = req.TransactionAccount.DisplayDescription
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update transaction account")
	}
	return TransactionAccountToProto(m), nil
}

func (s *transactionAccountServiceServer) DeleteTransactionAccount(ctx context.Context, req *gen.DeleteTransactionAccountRequest) (*emptypb.Empty, error) {
	id, err := idFromName(req.Name, "transactionAccounts/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid transaction account name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "transaction account not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete transaction account")
	}
	return &emptypb.Empty{}, nil
}
