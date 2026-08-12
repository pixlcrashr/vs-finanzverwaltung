package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	statusInvalidBudgetRevisionAccountValueName = status.New(codes.InvalidArgument, "invalid budget revision account value name")
	statusInvalidParentRevisionName             = status.New(codes.InvalidArgument, "invalid parent revision name")
	statusBudgetRevisionAccountValueNotFound    = status.New(codes.NotFound, "budget revision account value not found")
	statusFailedGetBudgetRevisionAccountValue   = status.New(codes.Internal, "failed to get budget revision account value")
	statusFailedListBudgetRevisionAccountValues = status.New(codes.Internal, "failed to list budget revision account values")
)

type budgetRevisionAccountValueServiceServer struct {
	gen.UnimplementedBudgetRevisionAccountValueServiceServer
	repo        *repository.BudgetRevisionAccountValueRepository
	accountRepo *repository.AccountRepository
	enforcer    *authz.Enforcer
}

func newBudgetRevisionAccountValueServiceServer(repo *repository.BudgetRevisionAccountValueRepository, accountRepo *repository.AccountRepository, enforcer *authz.Enforcer) gen.BudgetRevisionAccountValueServiceServer {
	return &budgetRevisionAccountValueServiceServer{repo: repo, accountRepo: accountRepo, enforcer: enforcer}
}

func (s *budgetRevisionAccountValueServiceServer) GetBudgetRevisionAccountValue(ctx context.Context, req *gen.GetBudgetRevisionAccountValueRequest) (*gen.BudgetRevisionAccountValue, error) {
	var n gen.BudgetRevisionAccountValueResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidBudgetRevisionAccountValueName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionRead, authz.OrgDomain(n.Organization)); err != nil {
		return nil, authError(err)
	}

	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidBudgetRevisionAccountValueName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetRevisionAccountValueNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetRevisionAccountValueNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetBudgetRevisionAccountValue}
	}

	account, _ := s.accountRepo.GetByID(ctx, m.AccountID)

	return BudgetRevisionAccountValueToProto(n.BudgetRevisionResourceName(), m, account), nil
}

func (s *budgetRevisionAccountValueServiceServer) ListBudgetRevisionAccountValues(ctx context.Context, req *gen.ListBudgetRevisionAccountValuesRequest) (*gen.ListBudgetRevisionAccountValuesResponse, error) {
	var pn gen.BudgetRevisionResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentRevisionName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionRead, authz.OrgDomain(pn.Organization)); err != nil {
		return nil, authError(err)
	}

	revisionID, err := uuid.Parse(pn.Revision)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentRevisionName}
	}

	c, err := svcfilter.ParseBudgetRevisionAccountValueFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
	}

	// Resolve "account" resource names in the filter to account UUIDs.
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentRevisionName}
	}
	c = cond.Transform(c, func(field string, value interface{}) (string, interface{}, bool) {
		if field != "account" {
			return field, value, true
		}
		accountName, ok := value.(string)
		if !ok {
			return field, value, true
		}
		var accountRN gen.AccountResourceName
		if err := accountRN.UnmarshalString(accountName); err != nil {
			return field, value, false
		}
		a, err := s.accountRepo.GetByCustomID(ctx, orgID, accountRN.Account)
		if err != nil {
			return field, value, false
		}
		return "account", a.ID.String(), true
	})

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidPageToken}
	}

	pageSize := normalizePageSize(req.PageSize)

	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrderBy}
	}

	orderExprs, _ := order.Resolve(orderBy, order.FieldMapper{
		"account":    "account_id",
		"value":      "value",
		"createTime": "created_at",
	})

	params := repository.ListBudgetRevisionAccountValuesParams{
		BudgetRevisionID: revisionID,
		Page:             int(offset/int64(pageSize)) + 1,
		PageSize:         pageSize,
		Cond:             c,
		OrderBy:          orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListBudgetRevisionAccountValues}
	}

	// Batch-fetch account models for the response.
	accountIDs := make([]uuid.UUID, 0, len(ms))
	for _, m := range ms {
		accountIDs = append(accountIDs, m.AccountID)
	}
	accountMap := s.fetchAccountsByIDs(ctx, accountIDs)

	resp := &gen.ListBudgetRevisionAccountValuesResponse{TotalSize: total}
	for _, m := range ms {
		resp.AccountValues = append(resp.AccountValues, BudgetRevisionAccountValueToProto(pn, m, accountMap[m.AccountID]))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

// fetchAccountsByIDs fetches multiple accounts by ID and returns a map keyed by account ID.
// Accounts that cannot be found are omitted from the map.
func (s *budgetRevisionAccountValueServiceServer) fetchAccountsByIDs(ctx context.Context, ids []uuid.UUID) map[uuid.UUID]*model.Account {
	result := make(map[uuid.UUID]*model.Account, len(ids))
	for _, id := range ids {
		if a, err := s.accountRepo.GetByID(ctx, id); err == nil {
			result[id] = a
		}
	}
	return result
}
