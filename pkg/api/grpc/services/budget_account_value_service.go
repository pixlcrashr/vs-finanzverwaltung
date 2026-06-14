package services

import (
	"context"

	"errors"

	"github.com/cockroachdb/apd/v3"
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
	errAccountValueRequired                 = status.Error(codes.InvalidArgument, "account_value is required")
	errInvalidAccountValueName              = status.Error(codes.InvalidArgument, "invalid account value name")
	errInvalidParentBudgetName              = status.Error(codes.InvalidArgument, "invalid parent budget name")
	errInvalidValue                         = status.Error(codes.InvalidArgument, "invalid value")
	errBudgetAccountValueNotFound           = status.Error(codes.NotFound, "budget account value not found")
	errBudgetAccountValueAlreadyExists      = status.Error(codes.AlreadyExists, "budget account value with this ID already exists")
	errFailedGetBudgetAccountValue          = status.Error(codes.Internal, "failed to get budget account value")
	errFailedListBudgetAccountValues        = status.Error(codes.Internal, "failed to list budget account values")
	errFailedCreateBudgetAccountValue       = status.Error(codes.Internal, "failed to create budget account value")
	errFailedUpdateBudgetAccountValue       = status.Error(codes.Internal, "failed to update budget account value")
	errFailedDeleteBudgetAccountValue       = status.Error(codes.Internal, "failed to delete budget account value")
	errFailedBatchUpdateBudgetAccountValues = status.Error(codes.Internal, "failed to batch update budget account values")
	errAccountValueNameMismatch             = status.Error(codes.InvalidArgument, "account value name does not match batch parent")
	errAccountValueRequestRequired          = status.Error(codes.InvalidArgument, "account_value is required in each request")
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
		return nil, errAccountValueRequired
	}
	var pn gen.BudgetResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParentBudgetName
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParentBudgetName
	}
	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, errInvalidParentBudgetName
	}
	accountID, err := uuid.Parse(req.AccountValue.AccountId)
	if err != nil {
		return nil, errInvalidAccountID
	}
	var val apd.Decimal
	if req.AccountValue.Value != nil {
		if _, _, err := val.SetString(req.AccountValue.Value.Value); err != nil {
			return nil, errInvalidValue
		}
	}
	m, err := s.repo.Create(ctx, repository.CreateBudgetAccountValueParams{
		OrganizationID: orgID,
		BudgetID:       budgetID,
		AccountID:      accountID,
		Value:          val,
		CustomID:       req.BudgetAccountValueId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrBudgetAccountValueAlreadyExists) {
			return nil, errBudgetAccountValueAlreadyExists
		}
		if errors.Is(err, repository.ErrBudgetNotFound) {
			return nil, errBudgetNotFound
		}
		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, errAccountNotFound
		}
		return nil, errFailedCreateBudgetAccountValue
	}
	return BudgetAccountValueToProto(pn.Organization, pn.Budget, m), nil
}

func (s *budgetAccountValueServiceServer) GetBudgetAccountValue(ctx context.Context, req *gen.GetBudgetAccountValueRequest) (*gen.BudgetAccountValue, error) {
	var n gen.BudgetAccountValueResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidAccountValueName
	}
	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, errInvalidAccountValueName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, errBudgetAccountValueNotFound
		}
		return nil, errFailedGetBudgetAccountValue
	}
	return BudgetAccountValueToProto(n.Organization, n.Budget, m), nil
}

func (s *budgetAccountValueServiceServer) ListBudgetAccountValues(ctx context.Context, req *gen.ListBudgetAccountValuesRequest) (*gen.ListBudgetAccountValuesResponse, error) {
	var pn gen.BudgetResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParentBudgetName
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParentBudgetName
	}
	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, errInvalidParentBudgetName
	}

	c, err := svcfilter.ParseBudgetAccountValueFilter(req.Filter)
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

	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
	}
	orderExprs, _ := order.Resolve(orderBy, repository.BudgetAccountValueOrderFieldMapper)

	params := repository.ListBudgetAccountValuesParams{
		OrganizationID: orgID,
		BudgetID:       budgetID,
		Cond:           c,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		OrderBy:        orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, errFailedListBudgetAccountValues
	}

	resp := &gen.ListBudgetAccountValuesResponse{TotalSize: total}
	for _, m := range ms {
		resp.AccountValues = append(resp.AccountValues, BudgetAccountValueToProto(pn.Organization, pn.Budget, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *budgetAccountValueServiceServer) UpdateBudgetAccountValue(ctx context.Context, req *gen.UpdateBudgetAccountValueRequest) (*gen.BudgetAccountValue, error) {
	if req.AccountValue == nil {
		return nil, errAccountValueRequired
	}
	var n gen.BudgetAccountValueResourceName
	if err := n.UnmarshalString(req.AccountValue.Name); err != nil {
		return nil, errInvalidAccountValueName
	}
	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, errInvalidAccountValueName
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if !isNotFound(err) {
			return nil, errFailedGetBudgetAccountValue
		}
		if !req.AllowMissing {
			return nil, errBudgetAccountValueNotFound
		}
		// allow_missing: create the resource
		orgID, err := uuid.Parse(n.Organization)
		if err != nil {
			return nil, errInvalidAccountValueName
		}
		budgetID, err := uuid.Parse(n.Budget)
		if err != nil {
			return nil, errInvalidAccountValueName
		}
		accountID, err := uuid.Parse(req.AccountValue.AccountId)
		if err != nil {
			return nil, errInvalidAccountID
		}
		var val apd.Decimal
		if req.AccountValue.Value != nil {
			if _, _, err := val.SetString(req.AccountValue.Value.Value); err != nil {
				return nil, errInvalidValue
			}
		}
		newM, err := s.repo.Create(ctx, repository.CreateBudgetAccountValueParams{
			OrganizationID: orgID,
			BudgetID:       budgetID,
			AccountID:      accountID,
			Value:          val,
		})
		if err != nil {
			return nil, errFailedCreateBudgetAccountValue
		}
		return BudgetAccountValueToProto(n.Organization, n.Budget, newM), nil
	}
	if req.AccountValue.Value != nil {
		if _, _, err := m.Value.SetString(req.AccountValue.Value.Value); err != nil {
			return nil, errInvalidValue
		}
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, errFailedUpdateBudgetAccountValue
	}
	return BudgetAccountValueToProto(n.Organization, n.Budget, m), nil
}

func (s *budgetAccountValueServiceServer) BatchUpdateBudgetAccountValues(ctx context.Context, req *gen.BatchUpdateBudgetAccountValuesRequest) (*gen.BatchUpdateBudgetAccountValuesResponse, error) {
	var pn gen.BudgetResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, errInvalidParentBudgetName
	}
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, errInvalidParentBudgetName
	}
	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, errInvalidParentBudgetName
	}

	entries := make([]repository.UpsertEntry, 0, len(req.Requests))
	for _, r := range req.Requests {
		if r.AccountValue == nil {
			return nil, errAccountValueRequestRequired
		}
		// Validate that any set resource name is consistent with the batch parent.
		if r.AccountValue.Name != "" {
			var n gen.BudgetAccountValueResourceName
			if err := n.UnmarshalString(r.AccountValue.Name); err != nil {
				return nil, errInvalidAccountValueName
			}
			if n.Organization != pn.Organization || n.Budget != pn.Budget {
				return nil, errAccountValueNameMismatch
			}
		}
		accountID, err := uuid.Parse(r.AccountValue.AccountId)
		if err != nil {
			return nil, status.Errorf(codes.InvalidArgument, "invalid account_id %q: %v", r.AccountValue.AccountId, err)
		}
		var val apd.Decimal
		if r.AccountValue.Value != nil {
			if _, _, err := val.SetString(r.AccountValue.Value.Value); err != nil {
				return nil, status.Errorf(codes.InvalidArgument, "invalid value for account %q: %v", r.AccountValue.AccountId, err)
			}
		}
		entries = append(entries, repository.UpsertEntry{AccountID: accountID, Value: val})
	}

	ms, err := s.repo.BatchUpsert(ctx, orgID, budgetID, entries)
	if err != nil {
		return nil, errFailedBatchUpdateBudgetAccountValues
	}

	resp := &gen.BatchUpdateBudgetAccountValuesResponse{}
	for _, m := range ms {
		resp.AccountValues = append(resp.AccountValues, BudgetAccountValueToProto(pn.Organization, pn.Budget, m))
	}
	return resp, nil
}

func (s *budgetAccountValueServiceServer) DeleteBudgetAccountValue(ctx context.Context, req *gen.DeleteBudgetAccountValueRequest) (*emptypb.Empty, error) {
	var n gen.BudgetAccountValueResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, errInvalidAccountValueName
	}
	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, errInvalidAccountValueName
	}
	if err := s.repo.Delete(ctx, id); err != nil {
		if isNotFound(err) {
			return nil, errBudgetAccountValueNotFound
		}
		return nil, errFailedDeleteBudgetAccountValue
	}
	return &emptypb.Empty{}, nil
}
