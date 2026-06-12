package services

import (
	"context"

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
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization in budget name")
	}
	// Use CustomID (n.Budget) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget")
	}
	return BudgetToProto(m), nil
}

func (s *budgetServiceServer) ListBudgets(ctx context.Context, req *gen.ListBudgetsRequest) (*gen.ListBudgetsResponse, error) {
	var pn gen.OrganizationResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent")
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent")
	}

	c, err := svcfilter.ParseBudgetFilter(req.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid page_token")
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
		return nil, status.Error(codes.Internal, "failed to list budgets")
	}

	resp := &gen.ListBudgetsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Budgets = append(resp.Budgets, BudgetToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *budgetServiceServer) CreateBudget(ctx context.Context, req *gen.CreateBudgetRequest) (*gen.Budget, error) {
	if req.Budget == nil {
		return nil, status.Error(codes.InvalidArgument, "budget is required")
	}
	var n gen.OrganizationResourceName
	if err := n.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent")
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent")
	}
	b := req.Budget
	m := &model.Budget{
		OrganizationID:     orgID,
		DisplayName:        b.DisplayName,
		DisplayDescription: b.DisplayDescription,
		CustomID:           req.BudgetId,
	}
	if b.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(b.PeriodStart)
	}
	if b.PeriodEnd != nil {
		m.PeriodEnd = protoDateToTime(b.PeriodEnd)
	}
	if err := s.repo.Create(ctx, m); err != nil {
		if isDuplicateKey(err) {
			return nil, status.Error(codes.AlreadyExists, "budget with this ID already exists")
		}
		return nil, status.Error(codes.Internal, "failed to create budget")
	}
	return BudgetToProto(m), nil
}

func (s *budgetServiceServer) UpdateBudget(ctx context.Context, req *gen.UpdateBudgetRequest) (*gen.Budget, error) {
	if req.Budget == nil {
		return nil, status.Error(codes.InvalidArgument, "budget is required")
	}
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Budget.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization in budget name")
	}
	// Use CustomID (n.Budget) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget")
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
		return nil, status.Error(codes.Internal, "failed to update budget")
	}
	return BudgetToProto(m), nil
}

func (s *budgetServiceServer) CloseBudget(ctx context.Context, req *gen.CloseBudgetRequest) (*gen.Budget, error) {
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization in budget name")
	}
	// Use CustomID (n.Budget) instead of parsing as UUID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget")
	}
	m.IsClosed = true
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to close budget")
	}
	return BudgetToProto(m), nil
}

func (s *budgetServiceServer) DeleteBudget(ctx context.Context, req *gen.DeleteBudgetRequest) (*emptypb.Empty, error) {
	var n gen.BudgetResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	orgID, err := uuid.Parse(n.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid organization in budget name")
	}
	// Use CustomID (n.Budget) to find the budget, then delete by actual ID
	m, err := s.repo.GetByCustomID(ctx, orgID, n.Budget)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget")
	}
	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete budget")
	}
	return &emptypb.Empty{}, nil
}
