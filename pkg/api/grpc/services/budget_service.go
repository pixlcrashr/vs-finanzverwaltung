package services

import (
	"context"

	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
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
	id, err := idFromName(req.Name, "budgets/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget")
	}
	return BudgetToProto(m), nil
}

func (s *budgetServiceServer) ListBudgets(ctx context.Context, req *gen.ListBudgetsRequest) (*gen.ListBudgetsResponse, error) {
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
	} else if pageSize > 100 {
		pageSize = 100
	}

	params := repository.ListBudgetsParams{
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
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
	b := req.Budget
	m := &model.Budget{
		DisplayName:        b.DisplayName,
		DisplayDescription: b.DisplayDescription,
	}
	if b.PeriodStart != nil {
		m.PeriodStart = protoDateToTime(b.PeriodStart)
	}
	if b.PeriodEnd != nil {
		m.PeriodEnd = protoDateToTime(b.PeriodEnd)
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create budget")
	}
	return BudgetToProto(m), nil
}

func (s *budgetServiceServer) UpdateBudget(ctx context.Context, req *gen.UpdateBudgetRequest) (*gen.Budget, error) {
	if req.Budget == nil {
		return nil, status.Error(codes.InvalidArgument, "budget is required")
	}
	id, err := idFromName(req.Budget.Name, "budgets/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	m, err := s.repo.GetByID(ctx, id)
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
	id, err := idFromName(req.Name, "budgets/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	m, err := s.repo.GetByID(ctx, id)
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
	id, err := idFromName(req.Name, "budgets/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget name")
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete budget")
	}
	return &emptypb.Empty{}, nil
}
