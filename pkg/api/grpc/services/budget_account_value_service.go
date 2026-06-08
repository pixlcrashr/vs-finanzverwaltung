package services

import (
	"context"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type budgetAccountValueServiceServer struct {
	gen.UnimplementedBudgetAccountValueServiceServer
	repo *repository.BudgetAccountValueRepository
}

func newBudgetAccountValueServiceServer(repo *repository.BudgetAccountValueRepository) gen.BudgetAccountValueServiceServer {
	return &budgetAccountValueServiceServer{repo: repo}
}

func (s *budgetAccountValueServiceServer) CreateBudgetAccountValue(ctx context.Context, req *gen.CreateBudgetAccountValueRequest) (*gen.BudgetAccountValue, error) {
	if req.AccountValue == nil {
		return nil, status.Error(codes.InvalidArgument, "account_value is required")
	}
	var pn gen.BudgetResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	accountID, err := uuid.Parse(req.AccountValue.AccountId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_id")
	}
	var val apd.Decimal
	if req.AccountValue.Value != nil {
		if _, _, err := val.SetString(req.AccountValue.Value.Value); err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid value")
		}
	}
	m := &model.BudgetAccountValue{
		OrganizationID: orgID,
		BudgetID:       budgetID,
		AccountID:      accountID,
		Value:          val,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create budget account value")
	}
	return BudgetAccountValueToProto(m), nil
}

func (s *budgetAccountValueServiceServer) UpdateBudgetAccountValue(ctx context.Context, req *gen.UpdateBudgetAccountValueRequest) (*gen.BudgetAccountValue, error) {
	if req.AccountValue == nil {
		return nil, status.Error(codes.InvalidArgument, "account_value is required")
	}
	var n gen.BudgetAccountValueResourceName
	if err := n.UnmarshalString(req.AccountValue.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account value name")
	}
	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account value name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget account value not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget account value")
	}
	if req.AccountValue.Value != nil {
		if _, _, err := m.Value.SetString(req.AccountValue.Value.Value); err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid value")
		}
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update budget account value")
	}
	return BudgetAccountValueToProto(m), nil
}
