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
	statusTransactionRequired               = status.New(codes.InvalidArgument, "transaction is required")
	statusInvalidTransactionName            = status.New(codes.InvalidArgument, "invalid transaction name")
	statusInvalidCreditTransactionAccountID = status.New(codes.InvalidArgument, "invalid credit_transaction_account_id")
	statusInvalidDebitTransactionAccountID  = status.New(codes.InvalidArgument, "invalid debit_transaction_account_id")
	statusTransactionAlreadyExists          = status.New(codes.AlreadyExists, "transaction with this ID already exists")
	statusFailedGetTransaction              = status.New(codes.Internal, "failed to get transaction")
	statusFailedListTransactions            = status.New(codes.Internal, "failed to list transactions")
	statusFailedCreateTransaction           = status.New(codes.Internal, "failed to create transaction")
	statusFailedUpdateTransaction           = status.New(codes.Internal, "failed to update transaction")
	statusFailedDeleteTransaction           = status.New(codes.Internal, "failed to delete transaction")
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
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionName}
	}

	id, err := uuid.Parse(n.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetTransaction}
	}

	return TransactionToProto(n.Organization, n.Transaction, m), nil
}

func (s *transactionServiceServer) ListTransactions(ctx context.Context, req *gen.ListTransactionsRequest) (*gen.ListTransactionsResponse, error) {
	var pn gen.OrganizationResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	c, err := svcfilter.ParseTransactionFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
	}

	pageSize := normalizePageSize(req.PageSize)

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidPageToken}
	}

	params := repository.ListTransactionsParams{
		PageSize: pageSize,
		Offset:   int(offset),
		Cond:     c,
	}

	ms, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListTransactions}
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
		return nil, &ServerError{Status: statusTransactionRequired}
	}

	var n gen.OrganizationResourceName

	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	t := req.Transaction

	creditID, err := uuid.Parse(t.CreditTransactionAccountId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidCreditTransactionAccountID}
	}

	debitID, err := uuid.Parse(t.DebitTransactionAccountId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidDebitTransactionAccountID}
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
			return nil, &ServerError{Err: err, Status: statusTransactionAlreadyExists}
		}

		if errors.Is(err, repository.ErrTransactionAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateTransaction}
	}

	return TransactionToProto(n.Organization, req.TransactionId, m), nil
}

func (s *transactionServiceServer) UpdateTransaction(ctx context.Context, req *gen.UpdateTransactionRequest) (*gen.Transaction, error) {
	if req.Transaction == nil {
		return nil, &ServerError{Status: statusTransactionRequired}
	}

	var n gen.TransactionResourceName

	if err := n.UnmarshalString(req.Transaction.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionName}
	}

	id, err := uuid.Parse(n.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetTransaction}
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
		return nil, &ServerError{Err: err, Status: statusFailedUpdateTransaction}
	}

	return TransactionToProto(n.Organization, n.Transaction, m), nil
}

func (s *transactionServiceServer) DeleteTransaction(ctx context.Context, req *gen.DeleteTransactionRequest) (*emptypb.Empty, error) {
	var n gen.TransactionResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionName}
	}

	id, err := uuid.Parse(n.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionName}
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		if errors.Is(err, repository.ErrTransactionNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteTransaction}
	}

	return &emptypb.Empty{}, nil
}
