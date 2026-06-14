package services

import (
	"context"

	"errors"

	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

var (
	errTransactionRequired               = status.Error(codes.InvalidArgument, "transaction is required")
	errInvalidTransactionName            = status.Error(codes.InvalidArgument, "invalid transaction name")
	errInvalidCreditTransactionAccountID = status.Error(codes.InvalidArgument, "invalid credit_transaction_account_id")
	errInvalidDebitTransactionAccountID  = status.Error(codes.InvalidArgument, "invalid debit_transaction_account_id")
	errTransactionAlreadyExists          = status.Error(codes.AlreadyExists, "transaction with this ID already exists")
	errFailedGetTransaction              = status.Error(codes.Internal, "failed to get transaction")
	errFailedListTransactions            = status.Error(codes.Internal, "failed to list transactions")
	errFailedCreateTransaction           = status.Error(codes.Internal, "failed to create transaction")
	errFailedUpdateTransaction           = status.Error(codes.Internal, "failed to update transaction")
	errFailedDeleteTransaction           = status.Error(codes.Internal, "failed to delete transaction")
)

type transactionServiceServer struct {
	gen.UnimplementedTransactionServiceServer
	repo *repository.TransactionRepository
}

func newTransactionServiceServer(repo *repository.TransactionRepository) gen.TransactionServiceServer {
	return &transactionServiceServer{repo: repo}
}

func (s *transactionServiceServer) GetTransaction(ctx context.Context, req *gen.GetTransactionRequest) (*gen.Transaction, error) {
	var n gen.TransactionResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidTransactionName
	}
	id, err := uuid.Parse(n.Transaction)
	if err != nil {
		return nil, errInvalidTransactionName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errTransactionNotFound
		}
		return nil, errFailedGetTransaction
	}
	return TransactionToProto(n.Organization, n.Transaction, m), nil
}

func (s *transactionServiceServer) ListTransactions(ctx context.Context, req *gen.ListTransactionsRequest) (*gen.ListTransactionsResponse, error) {
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}

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
		return nil, errInvalidPageToken
	}

	params := repository.ListTransactionsParams{
		PageSize: pageSize,
		Offset:   int(offset),
		Cond:     c,
	}

	ms, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListTransactions
	}

	resp := &gen.ListTransactionsResponse{}
	for _, m := range ms {
		resp.Transactions = append(resp.Transactions, TransactionToProto(pn.Organization, m.CustomID, m))
	}
	if len(ms) == pageSize {
		resp.NextPageToken = pagetoken.Encode(offset + int64(len(ms)))
	}
	return resp, nil
}

func (s *transactionServiceServer) CreateTransaction(ctx context.Context, req *gen.CreateTransactionRequest) (*gen.Transaction, error) {
	if req.Transaction == nil {
		return nil, errTransactionRequired
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidParent
	}
	t := req.Transaction
	creditID, err := uuid.Parse(t.CreditTransactionAccountId)
	if err != nil {
		return nil, errInvalidCreditTransactionAccountID
	}
	debitID, err := uuid.Parse(t.DebitTransactionAccountId)
	if err != nil {
		return nil, errInvalidDebitTransactionAccountID
	}
	params := repository.CreateTransactionParams{
		OrganizationID:             orgID,
		CreditTransactionAccountID: creditID,
		DebitTransactionAccountID:  debitID,
		Description:                t.Description,
		Reference:                  t.Reference,
		CustomID:                   req.TransactionId,
	}
	if t.BookedAt != nil {
		params.BookedAt = t.BookedAt.AsTime()
	}
	if t.DocumentDate != nil {
		params.DocumentDate = t.DocumentDate.AsTime()
	}
	m, err := s.repo.Create(ctx, params)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAlreadyExists) {
			return nil, errTransactionAlreadyExists
		}
		if errors.Is(err, repository.ErrTransactionAccountNotFound) {
			return nil, errTransactionAccountNotFound
		}
		return nil, errFailedCreateTransaction
	}
	return TransactionToProto(n.Organization, req.TransactionId, m), nil
}

func (s *transactionServiceServer) UpdateTransaction(ctx context.Context, req *gen.UpdateTransactionRequest) (*gen.Transaction, error) {
	if req.Transaction == nil {
		return nil, errTransactionRequired
	}
	var n gen.TransactionResourceName
	if err := n.UnmarshalString(req.Transaction.Name); err != nil {
		return nil, errInvalidTransactionName
	}
	id, err := uuid.Parse(n.Transaction)
	if err != nil {
		return nil, errInvalidTransactionName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errTransactionNotFound
		}
		return nil, errFailedGetTransaction
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
		return nil, errFailedUpdateTransaction
	}
	return TransactionToProto(n.Organization, n.Transaction, m), nil
}

func (s *transactionServiceServer) DeleteTransaction(ctx context.Context, req *gen.DeleteTransactionRequest) (*emptypb.Empty, error) {
	var n gen.TransactionResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidTransactionName
	}
	id, err := uuid.Parse(n.Transaction)
	if err != nil {
		return nil, errInvalidTransactionName
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, errTransactionNotFound
		}
		return nil, errFailedDeleteTransaction
	}
	return &emptypb.Empty{}, nil
}
