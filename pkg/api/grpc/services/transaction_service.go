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

type transactionServiceServer struct {
	gen.UnimplementedTransactionServiceServer
	repo *repository.TransactionRepository
}

func newTransactionServiceServer(repo *repository.TransactionRepository) gen.TransactionServiceServer {
	return &transactionServiceServer{repo: repo}
}

func (s *transactionServiceServer) GetTransaction(ctx context.Context, req *gen.GetTransactionRequest) (*gen.Transaction, error) {
	id, err := idFromName(req.Name, "transactions/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid transaction name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "transaction not found")
		}
		return nil, status.Error(codes.Internal, "failed to get transaction")
	}
	return TransactionToProto(m), nil
}

func (s *transactionServiceServer) ListTransactions(ctx context.Context, req *gen.ListTransactionsRequest) (*gen.ListTransactionsResponse, error) {
	c, err := svcfilter.ParseTransactionFilter(req.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
	}

	pageSize := int(req.PageSize)
	if pageSize <= 0 {
		pageSize = 20
	} else if pageSize > 100 {
		pageSize = 100
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid page_token")
	}

	params := repository.ListTransactionsParams{
		PageSize: pageSize,
		Cond:     c,
	}

	ms, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list transactions")
	}

	resp := &gen.ListTransactionsResponse{}
	for _, m := range ms {
		resp.Transactions = append(resp.Transactions, TransactionToProto(m))
	}
	if len(ms) == pageSize {
		nextOffset := offset + int64(len(ms))
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *transactionServiceServer) CreateTransaction(ctx context.Context, req *gen.CreateTransactionRequest) (*gen.Transaction, error) {
	if req.Transaction == nil {
		return nil, status.Error(codes.InvalidArgument, "transaction is required")
	}
	t := req.Transaction
	creditID, err := uuid.Parse(t.CreditTransactionAccountId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid credit_transaction_account_id")
	}
	debitID, err := uuid.Parse(t.DebitTransactionAccountId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid debit_transaction_account_id")
	}
	m := &model.Transaction_{
		CreditTransactionAccountID: creditID,
		DebitTransactionAccountID:  debitID,
		Description:                t.Description,
		Reference:                  t.Reference,
	}
	if t.BookedAt != nil {
		m.BookedAt = t.BookedAt.AsTime()
	}
	if t.DocumentDate != nil {
		m.DocumentDate = t.DocumentDate.AsTime()
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create transaction")
	}
	return TransactionToProto(m), nil
}

func (s *transactionServiceServer) UpdateTransaction(ctx context.Context, req *gen.UpdateTransactionRequest) (*gen.Transaction, error) {
	if req.Transaction == nil {
		return nil, status.Error(codes.InvalidArgument, "transaction is required")
	}
	id, err := idFromName(req.Transaction.Name, "transactions/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid transaction name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "transaction not found")
		}
		return nil, status.Error(codes.Internal, "failed to get transaction")
	}
	t := req.Transaction
	m.Description = t.Description
	m.Reference = t.Reference
	if t.BookedAt != nil {
		m.BookedAt = t.BookedAt.AsTime()
	}
	if t.DocumentDate != nil {
		m.DocumentDate = t.DocumentDate.AsTime()
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update transaction")
	}
	return TransactionToProto(m), nil
}

func (s *transactionServiceServer) DeleteTransaction(ctx context.Context, req *gen.DeleteTransactionRequest) (*emptypb.Empty, error) {
	id, err := idFromName(req.Name, "transactions/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid transaction name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "transaction not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete transaction")
	}
	return &emptypb.Empty{}, nil
}
