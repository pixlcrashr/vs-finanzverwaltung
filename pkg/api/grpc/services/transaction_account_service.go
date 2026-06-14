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
	errTransactionAccountRequired                  = status.Error(codes.InvalidArgument, "transaction_account is required")
	errInvalidTransactionAccountName               = status.Error(codes.InvalidArgument, "invalid transaction account name")
	errInvalidOrganizationInTransactionAccountName = status.Error(codes.InvalidArgument, "invalid organization in transaction account name")
	errInvalidImportSourceID                       = status.Error(codes.InvalidArgument, "invalid import_source_id")
	errTransactionAccountAlreadyExists             = status.Error(codes.AlreadyExists, "transaction account with this ID already exists")
	errFailedGetTransactionAccount                 = status.Error(codes.Internal, "failed to get transaction account")
	errFailedListTransactionAccounts               = status.Error(codes.Internal, "failed to list transaction accounts")
	errFailedCreateTransactionAccount              = status.Error(codes.Internal, "failed to create transaction account")
	errFailedUpdateTransactionAccount              = status.Error(codes.Internal, "failed to update transaction account")
	errFailedDeleteTransactionAccount              = status.Error(codes.Internal, "failed to delete transaction account")
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
		return nil, errInvalidTransactionAccountName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInTransactionAccountName
	}
	// Use CustomID (n.TransactionAccount) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.TransactionAccount)
	if err != nil {
		if isNotFound(err) {
			return nil, errTransactionAccountNotFound
		}
		return nil, errFailedGetTransactionAccount
	}
	return TransactionAccountToProto(n.Organization, n.TransactionAccount, m), nil
}

func (s *transactionAccountServiceServer) ListTransactionAccounts(ctx context.Context, req *gen.ListTransactionAccountsRequest) (*gen.ListTransactionAccountsResponse, error) {
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}

	c, err := svcfilter.ParseTransactionAccountFilter(req.Filter)
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
	orderExprs, _ := order.Resolve(orderBy, repository.TransactionAccountOrderFieldMapper)

	params := repository.ListTransactionAccountsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListTransactionAccounts
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
		return nil, errTransactionAccountRequired
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidParent
	}
	srcID, err := uuid.Parse(req.TransactionAccount.ImportSourceId)
	if err != nil {
		return nil, errInvalidImportSourceID
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
			return nil, errTransactionAccountAlreadyExists
		}
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, errOrganizationNotFound
		}
		if errors.Is(err, repository.ErrImportSourceNotFound) {
			return nil, errImportSourceNotFound
		}
		return nil, errFailedCreateTransactionAccount
	}
	return TransactionAccountToProto(n.Organization, req.TransactionAccountId, m), nil
}

func (s *transactionAccountServiceServer) UpdateTransactionAccount(ctx context.Context, req *gen.UpdateTransactionAccountRequest) (*gen.TransactionAccount, error) {
	if req.TransactionAccount == nil {
		return nil, errTransactionAccountRequired
	}
	var n gen.TransactionAccountResourceName
	if err := n.UnmarshalString(req.TransactionAccount.Name); err != nil {
		return nil, errInvalidTransactionAccountName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInTransactionAccountName
	}
	// Use CustomID (n.TransactionAccount) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.TransactionAccount)
	if err != nil {
		if isNotFound(err) {
			return nil, errTransactionAccountNotFound
		}
		return nil, errFailedGetTransactionAccount
	}
	m.Code = req.TransactionAccount.Code
	m.DisplayName = req.TransactionAccount.DisplayName
	m.DisplayDescription = req.TransactionAccount.DisplayDescription
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedUpdateTransactionAccount
	}
	return TransactionAccountToProto(n.Organization, n.TransactionAccount, m), nil
}

func (s *transactionAccountServiceServer) DeleteTransactionAccount(ctx context.Context, req *gen.DeleteTransactionAccountRequest) (*emptypb.Empty, error) {
	var n gen.TransactionAccountResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidTransactionAccountName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInTransactionAccountName
	}
	// Use CustomID (n.TransactionAccount) to find the account, then delete by actual ID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.TransactionAccount)
	if err != nil {
		if isNotFound(err) {
			return nil, errTransactionAccountNotFound
		}
		return nil, errFailedGetTransactionAccount
	}
	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if isNotFound(err) {
			return nil, errTransactionAccountNotFound
		}
		return nil, errFailedDeleteTransactionAccount
	}
	return &emptypb.Empty{}, nil
}
