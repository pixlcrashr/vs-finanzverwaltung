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
	statusTransactionAccountRequired                  = status.New(codes.InvalidArgument, "transaction_account is required")
	statusInvalidTransactionAccountName               = status.New(codes.InvalidArgument, "invalid transaction account name")
	statusInvalidOrganizationInTransactionAccountName = status.New(codes.InvalidArgument, "invalid organization in transaction account name")
	statusInvalidImportSourceID                       = status.New(codes.InvalidArgument, "invalid import_source_id")
	statusTransactionAccountAlreadyExists             = status.New(codes.AlreadyExists, "transaction account with this ID already exists")
	statusFailedGetTransactionAccount                 = status.New(codes.Internal, "failed to get transaction account")
	statusFailedListTransactionAccounts               = status.New(codes.Internal, "failed to list transaction accounts")
	statusFailedCreateTransactionAccount              = status.New(codes.Internal, "failed to create transaction account")
	statusFailedUpdateTransactionAccount              = status.New(codes.Internal, "failed to update transaction account")
	statusFailedDeleteTransactionAccount              = status.New(codes.Internal, "failed to delete transaction account")
)

type transactionAccountServiceServer struct {
	gen.UnimplementedTransactionAccountServiceServer
	repo *repository.TransactionAccountRepository
}

func newTransactionAccountServiceServer(repo *repository.TransactionAccountRepository) gen.TransactionAccountServiceServer {
	return &transactionAccountServiceServer{repo: repo}
}

func (s *transactionAccountServiceServer) GetTransactionAccount(ctx context.Context, req *gen.GetTransactionAccountRequest) (*gen.TransactionAccount, error) {
	var n gen.TransactionAccountResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInTransactionAccountName}
	}

	// Use CustomID (n.TransactionAccount) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.TransactionAccount)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetTransactionAccount}
	}

	return TransactionAccountToProto(n.Organization, n.TransactionAccount, m), nil
}

func (s *transactionAccountServiceServer) ListTransactionAccounts(ctx context.Context, req *gen.ListTransactionAccountsRequest) (*gen.ListTransactionAccountsResponse, error) {
	var pn gen.OrganizationResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	c, err := svcfilter.ParseTransactionAccountFilter(req.Filter)
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

	orderExprs, _ := order.Resolve(orderBy, repository.TransactionAccountOrderFieldMapper)

	params := repository.ListTransactionAccountsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListTransactionAccounts}
	}

	resp := &gen.ListTransactionAccountsResponse{TotalSize: total}
	for _, m := range ms {
		resp.TransactionAccounts = append(resp.TransactionAccounts, TransactionAccountToProto(pn.Organization, m.CustomID, m))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *transactionAccountServiceServer) CreateTransactionAccount(ctx context.Context, req *gen.CreateTransactionAccountRequest) (*gen.TransactionAccount, error) {
	if req.TransactionAccount == nil {
		return nil, &ServerError{Status: statusTransactionAccountRequired}
	}

	var n gen.OrganizationResourceName

	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	srcID, err := uuid.Parse(req.TransactionAccount.ImportSourceId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidImportSourceID}
	}

	m, err := s.repo.Create(ctx, repository.CreateTransactionAccountParams{
		OrganizationID:     orgID,
		Code:               req.TransactionAccount.Code,
		ImportSourceID:     srcID,
		DisplayName:        req.TransactionAccount.DisplayName,
		DisplayDescription: req.TransactionAccount.DisplayDescription,
		CustomID:           req.TransactionAccountId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusTransactionAccountAlreadyExists}
		}

		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, &ServerError{Err: err, Status: statusOrganizationNotFound}
		}

		if errors.Is(err, repository.ErrImportSourceNotFound) {
			return nil, &ServerError{Err: err, Status: statusImportSourceNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateTransactionAccount}
	}

	return TransactionAccountToProto(n.Organization, req.TransactionAccountId, m), nil
}

func (s *transactionAccountServiceServer) UpdateTransactionAccount(ctx context.Context, req *gen.UpdateTransactionAccountRequest) (*gen.TransactionAccount, error) {
	if req.TransactionAccount == nil {
		return nil, &ServerError{Status: statusTransactionAccountRequired}
	}

	var n gen.TransactionAccountResourceName

	if err := n.UnmarshalString(req.TransactionAccount.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInTransactionAccountName}
	}

	// Use CustomID (n.TransactionAccount) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.TransactionAccount)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetTransactionAccount}
	}

	m.Code = req.TransactionAccount.Code
	m.DisplayName = req.TransactionAccount.DisplayName
	m.DisplayDescription = req.TransactionAccount.DisplayDescription

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateTransactionAccount}
	}

	return TransactionAccountToProto(n.Organization, n.TransactionAccount, m), nil
}

func (s *transactionAccountServiceServer) DeleteTransactionAccount(ctx context.Context, req *gen.DeleteTransactionAccountRequest) (*emptypb.Empty, error) {
	var n gen.TransactionAccountResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInTransactionAccountName}
	}

	// Use CustomID (n.TransactionAccount) to find the account, then delete by actual ID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.TransactionAccount)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetTransactionAccount}
	}

	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if errors.Is(err, repository.ErrTransactionAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteTransactionAccount}
	}

	return &emptypb.Empty{}, nil
}
