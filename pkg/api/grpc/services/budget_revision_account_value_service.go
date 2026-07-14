package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
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
	repo     *repository.BudgetRevisionAccountValueRepository
	enforcer *authz.Enforcer
}

func newBudgetRevisionAccountValueServiceServer(repo *repository.BudgetRevisionAccountValueRepository, enforcer *authz.Enforcer) gen.BudgetRevisionAccountValueServiceServer {
	return &budgetRevisionAccountValueServiceServer{repo: repo, enforcer: enforcer}
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

	return BudgetRevisionAccountValueToProto(n.BudgetRevisionResourceName(), m), nil
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
		"accountId": "account_id",
		"value":     "value",
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

	resp := &gen.ListBudgetRevisionAccountValuesResponse{TotalSize: total}
	for _, m := range ms {
		resp.AccountValues = append(resp.AccountValues, BudgetRevisionAccountValueToProto(pn, m))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}
