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
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	statusInvalidActualAccountValueName       = status.New(codes.InvalidArgument, "invalid actual account value name")
	statusInvalidParentBudgetForActual        = status.New(codes.InvalidArgument, "invalid parent budget name")
	statusBudgetActualAccountValueNotFound    = status.New(codes.NotFound, "budget actual account value not found")
	statusFailedGetBudgetActualAccountValue   = status.New(codes.Internal, "failed to get budget actual account value")
	statusFailedListBudgetActualAccountValues = status.New(codes.Internal, "failed to list budget actual account values")
)

type budgetActualAccountValueServiceServer struct {
	gen.UnimplementedBudgetActualAccountValueServiceServer
	repo       *repository.BudgetActualAccountValueRepository
	budgetRepo *repository.BudgetRepository
	enforcer   *authz.Enforcer
}

func newBudgetActualAccountValueServiceServer(
	repo *repository.BudgetActualAccountValueRepository,
	budgetRepo *repository.BudgetRepository,
	enforcer *authz.Enforcer,
) gen.BudgetActualAccountValueServiceServer {
	return &budgetActualAccountValueServiceServer{repo: repo, budgetRepo: budgetRepo, enforcer: enforcer}
}

func (s *budgetActualAccountValueServiceServer) GetBudgetActualAccountValue(ctx context.Context, req *gen.GetBudgetActualAccountValueRequest) (*gen.BudgetActualAccountValue, error) {
	var n gen.BudgetActualAccountValueResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidActualAccountValueName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionRead, authz.OrgDomain(n.Organization)); err != nil {
		return nil, authError(err)
	}

	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidActualAccountValueName}
	}

	budget, err := s.budgetRepo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedGetBudgetActualAccountValue}
	}

	m, err := s.repo.GetByBudgetAndAccount(ctx, orgID, budget.PeriodStart, budget.PeriodEnd, n.Account)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetActualAccountValueNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetActualAccountValueNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedGetBudgetActualAccountValue}
	}

	return BudgetActualAccountValueToProto(n.BudgetResourceName(), m), nil
}

func (s *budgetActualAccountValueServiceServer) ListBudgetActualAccountValues(ctx context.Context, req *gen.ListBudgetActualAccountValuesRequest) (*gen.ListBudgetActualAccountValuesResponse, error) {
	var pn gen.BudgetResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetForActual}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionRead, authz.OrgDomain(pn.Organization)); err != nil {
		return nil, authError(err)
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetForActual}
	}

	budget, err := s.budgetRepo.GetByCustomID(ctx, orgID, pn.Budget)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedListBudgetActualAccountValues}
	}

	c, err := svcfilter.ParseBudgetActualAccountValueFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidPageToken}
	}

	pageSize := normalizePageSize(req.PageSize)

	allValues, err := s.repo.ListByBudget(ctx, orgID, budget.PeriodStart, budget.PeriodEnd)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListBudgetActualAccountValues}
	}

	// Apply filter in-memory since ListByBudget does not support SQL-level filtering.
	if c != nil && !c.IsEmpty() {
		filtered := make([]*repository.ActualAccountValue, 0, len(allValues))
		for _, v := range allValues {
			if evalActualAccountValueCond(c, v) {
				filtered = append(filtered, v)
			}
		}
		allValues = filtered
	}

	total := int64(len(allValues))

	// Apply pagination in-memory since the query is already computed.
	start := int(offset)
	if start > len(allValues) {
		start = len(allValues)
	}
	end := start + pageSize
	if end > len(allValues) {
		end = len(allValues)
	}
	page := allValues[start:end]

	resp := &gen.ListBudgetActualAccountValuesResponse{TotalSize: total}
	for _, m := range page {
		resp.ActualAccountValues = append(resp.ActualAccountValues, BudgetActualAccountValueToProto(pn, m))
	}

	nextOffset := offset + int64(len(page))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func evalActualAccountValueCond(c cond.Cond, v *repository.ActualAccountValue) bool {
	if c == nil || c.IsEmpty() {
		return true
	}
	switch cc := c.(type) {
	case cond.FieldCond:
		if cc.Field == "account_id" {
			s, ok := cc.Value.(string)
			if !ok {
				return false
			}
			switch cc.Op {
			case cond.OpEq:
				return v.AccountID.String() == s
			case cond.OpNe:
				return v.AccountID.String() != s
			}
		}
		return false
	case cond.AndCond:
		for _, sub := range cc.Conds {
			if !evalActualAccountValueCond(sub, v) {
				return false
			}
		}
		return true
	case cond.OrCond:
		for _, sub := range cc.Conds {
			if evalActualAccountValueCond(sub, v) {
				return true
			}
		}
		return false
	case cond.NotCond:
		return !evalActualAccountValueCond(cc.Inner, v)
	}
	return true
}
