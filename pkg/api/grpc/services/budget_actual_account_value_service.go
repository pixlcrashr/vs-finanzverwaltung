package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	statusInvalidActualAccountValueName      = status.New(codes.InvalidArgument, "invalid actual account value name")
	statusInvalidParentBudgetForActual       = status.New(codes.InvalidArgument, "invalid parent budget name")
	statusBudgetActualAccountValueNotFound   = status.New(codes.NotFound, "budget actual account value not found")
	statusFailedGetBudgetActualAccountValue  = status.New(codes.Internal, "failed to get budget actual account value")
	statusFailedListBudgetActualAccountValues = status.New(codes.Internal, "failed to list budget actual account values")
)

type budgetActualAccountValueServiceServer struct {
	gen.UnimplementedBudgetActualAccountValueServiceServer
	repo       *repository.BudgetActualAccountValueRepository
	budgetRepo *repository.BudgetRepository
}

func newBudgetActualAccountValueServiceServer(
	repo *repository.BudgetActualAccountValueRepository,
	budgetRepo *repository.BudgetRepository,
) gen.BudgetActualAccountValueServiceServer {
	return &budgetActualAccountValueServiceServer{repo: repo, budgetRepo: budgetRepo}
}

func (s *budgetActualAccountValueServiceServer) GetBudgetActualAccountValue(ctx context.Context, req *gen.GetBudgetActualAccountValueRequest) (*gen.BudgetActualAccountValue, error) {
	var n gen.BudgetActualAccountValueResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidActualAccountValueName}
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

	return BudgetActualAccountValueToProto(n.Organization, n.Budget, m), nil
}

func (s *budgetActualAccountValueServiceServer) ListBudgetActualAccountValues(ctx context.Context, req *gen.ListBudgetActualAccountValuesRequest) (*gen.ListBudgetActualAccountValuesResponse, error) {
	var pn gen.BudgetResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetForActual}
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

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidPageToken}
	}

	pageSize := normalizePageSize(req.PageSize)

	allValues, err := s.repo.ListByBudget(ctx, orgID, budget.PeriodStart, budget.PeriodEnd)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListBudgetActualAccountValues}
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
		resp.ActualAccountValues = append(resp.ActualAccountValues, BudgetActualAccountValueToProto(pn.Organization, pn.Budget, m))
	}

	nextOffset := offset + int64(len(page))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}
