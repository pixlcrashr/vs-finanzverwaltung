package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

var (
	statusAccountRequired                  = status.New(codes.InvalidArgument, "account is required")
	statusInvalidAccountName               = status.New(codes.InvalidArgument, "invalid account name")
	statusInvalidOrganizationInAccountName = status.New(codes.InvalidArgument, "invalid organization in account name")
	statusInvalidParentAccount             = status.New(codes.InvalidArgument, "invalid parent_account")
	statusInvalidParentAccountOrganization = status.New(codes.InvalidArgument, "invalid parent_account organization")
	statusParentAccountMustBeContainer     = status.New(codes.InvalidArgument, "parent account must be a container account")
	statusParentAccountNotFound            = status.New(codes.NotFound, "parent account not found")
	statusAccountAlreadyExists             = status.New(codes.AlreadyExists, "account with this ID already exists")
	statusFailedGetAccount                 = status.New(codes.Internal, "failed to get account")
	statusFailedGetParentAccount           = status.New(codes.Internal, "failed to get parent account")
	statusFailedListAccounts               = status.New(codes.Internal, "failed to list accounts")
	statusFailedCreateAccount              = status.New(codes.Internal, "failed to create account")
	statusFailedUpdateAccount              = status.New(codes.Internal, "failed to update account")
	statusFailedArchiveAccount             = status.New(codes.Internal, "failed to archive account")
	statusFailedDeleteAccount              = status.New(codes.Internal, "failed to delete account")
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
		return nil, &ServerError{Err: err, Status: statusInvalidAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountName}
	}

	// Use CustomID (n.Account) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Account)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccount}
	}

	return AccountToProto(n.Organization, m), nil
}

func (s *accountServiceServer) ListAccounts(ctx context.Context, req *gen.ListAccountsRequest) (*gen.ListAccountsResponse, error) {
	var pn gen.OrganizationResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	c, err := svcfilter.ParseAccountFilter(req.Filter)
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

	orderExprs, _ := order.Resolve(orderBy, repository.AccountOrderFieldMapper)

	params := repository.ListAccountsParams{
		OrganizationID: orgID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
		OrderBy:        orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListAccounts}
	}

	resp := &gen.ListAccountsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Accounts = append(resp.Accounts, AccountToProto(pn.Organization, m))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *accountServiceServer) ListNestedAccounts(ctx context.Context, req *gen.ListNestedAccountsRequest) (*gen.ListNestedAccountsResponse, error) {
	var pn gen.OrganizationResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	c, err := svcfilter.ParseAccountFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
	}

	params := repository.ListAccountsParams{
		OrganizationID: orgID,
		Page:           1,
		PageSize:       1000,
		Cond:           c,
	}

	ms, _, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListAccounts}
	}

	return &gen.ListNestedAccountsResponse{
		Accounts: buildNestedTree(pn.Organization, ms, uuid.NullUUID{}),
	}, nil
}

func (s *accountServiceServer) GetNestedAccount(ctx context.Context, req *gen.GetNestedAccountRequest) (*gen.GetNestedAccountResponse, error) {
	var n gen.AccountResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountName}
	}

	// Use CustomID (n.Account) instead of parsing as UUID
	root, err := s.repo.GetByCustomID(ctx, orgID, n.Account)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedGetAccount}
	}

	ms, _, err := s.repo.List(ctx, repository.ListAccountsParams{Page: 1, PageSize: 10000})
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListAccounts}
	}

	rootNested := NestedAccountToProto(n.Organization, root)
	rootNested.Children = buildNestedTree(n.Organization, ms, uuid.NullUUID{Valid: true, UUID: root.ID})

	return &gen.GetNestedAccountResponse{Account: rootNested}, nil
}

func (s *accountServiceServer) CreateAccount(ctx context.Context, req *gen.CreateAccountRequest) (*gen.Account, error) {
	if req.Account == nil {
		return nil, &ServerError{Status: statusAccountRequired}
	}

	var n gen.OrganizationResourceName

	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParent}
	}

	parentAccountID := uuid.NullUUID{}

	if req.Account.ParentAccount != "" {
		var pn gen.AccountResourceName

		if err := pn.UnmarshalString(req.Account.ParentAccount); err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidParentAccount}
		}

		parentOrgID, err := uuid.Parse(pn.Organization)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidParentAccountOrganization}
		}

		// Use CustomID (pn.Account) instead of parsing as UUID
		parent, err := s.repo.GetByCustomID(ctx, parentOrgID, pn.Account)
		if err != nil {
			if errors.Is(err, repository.ErrAccountNotFound) {
				return nil, &ServerError{Err: err, Status: statusParentAccountNotFound}
			}

			return nil, &ServerError{Err: err, Status: statusFailedGetParentAccount}
		}

		if !parent.IsContainer {
			return nil, &ServerError{Status: statusParentAccountMustBeContainer}
		}

		parentAccountID = uuid.NullUUID{Valid: true, UUID: parent.ID}
	}

	m, err := s.repo.Create(ctx, repository.CreateAccountParams{
		OrganizationID:     orgID,
		ParentAccountID:    parentAccountID,
		DisplayName:        req.Account.DisplayName,
		DisplayCode:        req.Account.DisplayCode,
		DisplayDescription: req.Account.DisplayDescription,
		IsContainer:        req.Account.IsContainer,
		CustomID:           req.AccountId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrAccountAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusAccountAlreadyExists}
		}

		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, &ServerError{Err: err, Status: statusOrganizationNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateAccount}
	}

	return AccountToProto(n.Organization, m), nil
}

func (s *accountServiceServer) UpdateAccount(ctx context.Context, req *gen.UpdateAccountRequest) (*gen.Account, error) {
	if req.Account == nil {
		return nil, &ServerError{Status: statusAccountRequired}
	}

	var n gen.AccountResourceName

	if err := n.UnmarshalString(req.Account.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountName}
	}

	// Use CustomID (n.Account) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Account)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccount}
	}

	m.DisplayName = req.Account.DisplayName
	m.DisplayCode = req.Account.DisplayCode
	m.DisplayDescription = req.Account.DisplayDescription
	m.IsContainer = req.Account.IsContainer

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateAccount}
	}

	return AccountToProto(n.Organization, m), nil
}

func (s *accountServiceServer) ArchiveAccount(ctx context.Context, req *gen.ArchiveAccountRequest) (*gen.Account, error) {
	var n gen.AccountResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountName}
	}

	// Use CustomID (n.Account) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Account)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccount}
	}

	m.IsArchived = true

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedArchiveAccount}
	}

	return AccountToProto(n.Organization, m), nil
}

func (s *accountServiceServer) DeleteAccount(ctx context.Context, req *gen.DeleteAccountRequest) (*emptypb.Empty, error) {
	var n gen.AccountResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountName}
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrganizationInAccountName}
	}

	// Use CustomID (n.Account) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Account)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAccount}
	}

	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteAccount}
	}

	return &emptypb.Empty{}, nil
}

// buildNestedTree recursively assembles NestedAccount trees.
// parentID selects which accounts to treat as roots (empty = top-level roots).
func buildNestedTree(organizationCustomID string, all []*model.Account, parentID uuid.NullUUID) []*gen.NestedAccount {
	var result []*gen.NestedAccount

	for _, m := range all {
		if m.ParentAccountID == parentID {
			n := NestedAccountToProto(organizationCustomID, m)
			n.Children = buildNestedTree(organizationCustomID, all, uuid.NullUUID{Valid: true, UUID: m.ID})
			result = append(result, n)
		}
	}

	return result
}
