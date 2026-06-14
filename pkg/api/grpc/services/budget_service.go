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
	errBudgetRequired                  = status.Error(codes.InvalidArgument, "budget is required")
	errInvalidBudgetName               = status.Error(codes.InvalidArgument, "invalid budget name")
	errInvalidOrganizationInBudgetName = status.Error(codes.InvalidArgument, "invalid organization in budget name")
	errBudgetNotFound                  = status.Error(codes.NotFound, "budget not found")
	errBudgetAlreadyExists             = status.Error(codes.AlreadyExists, "budget with this ID already exists")
	errFailedGetBudget                 = status.Error(codes.Internal, "failed to get budget")
	errFailedListBudgets               = status.Error(codes.Internal, "failed to list budgets")
	errFailedCreateBudget              = status.Error(codes.Internal, "failed to create budget")
	errFailedUpdateBudget              = status.Error(codes.Internal, "failed to update budget")
	errFailedCloseBudget               = status.Error(codes.Internal, "failed to close budget")
	errFailedDeleteBudget              = status.Error(codes.Internal, "failed to delete budget")
)

type budgetServiceServer struct {
	gen.UnimplementedBudgetServiceServer
	repo *repository.BudgetRepository
}

func newBudgetServiceServer(repo *repository.BudgetRepository) gen.BudgetServiceServer {
	return &budgetServiceServer{repo: repo}
}

func (s *budgetServiceServer) GetBudget(ctx context.Context, req *gen.GetBudgetRequest) (*gen.Budget, error) {
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidBudgetName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInBudgetName
	}
	// Use CustomID (n.Budget) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, errBudgetNotFound
		}
		return nil, errFailedGetBudget
	}
	return BudgetToProto(n.Organization, m), nil
}

func (s *budgetServiceServer) ListBudgets(ctx context.Context, req *gen.ListBudgetsRequest) (*gen.ListBudgetsResponse, error) {
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParent
	}

	c, err := svcfilter.ParseBudgetFilter(req.Filter)
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
	} else if pageSize > 500 {
		pageSize = 500
	}

	// Parse order_by
	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
	}
	orderExprs, _ := order.Resolve(orderBy, repository.BudgetOrderFieldMapper)

	params := repository.ListBudgetsParams{
		OrganizationID: orgID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
		OrderBy:        orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListBudgets
	}

	resp := &gen.ListBudgetsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Budgets = append(resp.Budgets, BudgetToProto(pn.Organization, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *budgetServiceServer) CreateBudget(ctx context.Context, req *gen.CreateBudgetRequest) (*gen.Budget, error) {
	if req.Budget == nil {
		return nil, errBudgetRequired
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParent
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidParent
	}
	b := req.Budget
	params := repository.CreateBudgetParams{
		OrganizationID:     orgID,
		DisplayName:        b.DisplayName,
		DisplayDescription: b.DisplayDescription,
		CustomID:           req.BudgetId,
	}
	if b.PeriodStart != nil {
		params.PeriodStart = protoDateToTime(b.PeriodStart)
	}
	if b.PeriodEnd != nil {
		params.PeriodEnd = protoDateToTime(b.PeriodEnd)
	}
	m, err := s.repo.Create(ctx, params)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetAlreadyExists) {
			return nil, errBudgetAlreadyExists
		}
		if errors.Is(err, repository.ErrOrganizationNotFound) {
			return nil, errOrganizationNotFound
		}
		return nil, errFailedCreateBudget
	}
	return BudgetToProto(n.Organization, m), nil
}

func (s *budgetServiceServer) UpdateBudget(ctx context.Context, req *gen.UpdateBudgetRequest) (*gen.Budget, error) {
	if req.Budget == nil {
		return nil, errBudgetRequired
	}
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Budget.Name); err != nil {
		return nil, errInvalidBudgetName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInBudgetName
	}
	// Use CustomID (n.Budget) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, errBudgetNotFound
		}
		return nil, errFailedGetBudget
	}
	m.DisplayName = req.Budget.DisplayName
	m.DisplayDescription = req.Budget.DisplayDescription
	if req.Budget.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(req.Budget.PeriodStart)
	}
	if req.Budget.PeriodEnd != nil {
		m.PeriodEnd = protoDateToTime(req.Budget.PeriodEnd)
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedUpdateBudget
	}
	return BudgetToProto(n.Organization, m), nil
}

func (s *budgetServiceServer) CloseBudget(ctx context.Context, req *gen.CloseBudgetRequest) (*gen.Budget, error) {
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidBudgetName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInBudgetName
	}
	// Use CustomID (n.Budget) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, errBudgetNotFound
		}
		return nil, errFailedGetBudget
	}
	m.IsClosed = true
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedCloseBudget
	}
	return BudgetToProto(n.Organization, m), nil
}

func (s *budgetServiceServer) DeleteBudget(ctx context.Context, req *gen.DeleteBudgetRequest) (*emptypb.Empty, error) {
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidBudgetName
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, errInvalidOrganizationInBudgetName
	}
	// Use CustomID (n.Budget) to find the budget, then delete by actual ID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, errBudgetNotFound
		}
		return nil, errFailedGetBudget
	}
	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if isNotFound(err) {
			return nil, errBudgetNotFound
		}
		return nil, errFailedDeleteBudget
	}
	return &emptypb.Empty{}, nil
}
