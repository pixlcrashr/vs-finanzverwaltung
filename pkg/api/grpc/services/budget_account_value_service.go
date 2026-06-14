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
	statusAccountValueRequired                 = status.New(codes.InvalidArgument, "account_value is required")
	statusInvalidAccountValueName              = status.New(codes.InvalidArgument, "invalid account value name")
	statusInvalidParentBudgetName              = status.New(codes.InvalidArgument, "invalid parent budget name")
	statusInvalidValue                         = status.New(codes.InvalidArgument, "invalid value")
	statusBudgetAccountValueNotFound           = status.New(codes.NotFound, "budget account value not found")
	statusBudgetAccountValueAlreadyExists      = status.New(codes.AlreadyExists, "budget account value with this ID already exists")
	statusFailedGetBudgetAccountValue          = status.New(codes.Internal, "failed to get budget account value")
	statusFailedListBudgetAccountValues        = status.New(codes.Internal, "failed to list budget account values")
	statusFailedCreateBudgetAccountValue       = status.New(codes.Internal, "failed to create budget account value")
	statusFailedUpdateBudgetAccountValue       = status.New(codes.Internal, "failed to update budget account value")
	statusFailedDeleteBudgetAccountValue       = status.New(codes.Internal, "failed to delete budget account value")
	statusFailedBatchUpdateBudgetAccountValues = status.New(codes.Internal, "failed to batch update budget account values")
	statusAccountValueNameMismatch             = status.New(codes.InvalidArgument, "account value name does not match batch parent")
	statusAccountValueRequestRequired          = status.New(codes.InvalidArgument, "account_value is required in each request")
	statusInvalidAccountValueInBatch           = status.New(codes.InvalidArgument, "invalid account_id in batch request")
	statusInvalidValueInBatch                  = status.New(codes.InvalidArgument, "invalid value in batch request")
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
		return nil, &ServerError{Status: statusAccountValueRequired}
	}

	var pn gen.BudgetResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	accountID, err := uuid.Parse(req.AccountValue.AccountId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountID}
	}

	var val apd.Decimal

	if req.AccountValue.Value != nil {
		if _, _, err := val.SetString(req.AccountValue.Value.Value); err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidValue}
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
			return nil, &ServerError{Err: err, Status: statusBudgetAccountValueAlreadyExists}
		}

		if errors.Is(err, repository.ErrBudgetNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetNotFound}
		}

		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateBudgetAccountValue}
	}

	return BudgetAccountValueToProto(pn.Organization, pn.Budget, m), nil
}

func (s *budgetAccountValueServiceServer) GetBudgetAccountValue(ctx context.Context, req *gen.GetBudgetAccountValueRequest) (*gen.BudgetAccountValue, error) {
	var n gen.BudgetAccountValueResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
	}

	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetAccountValueNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetAccountValueNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetBudgetAccountValue}
	}

	return BudgetAccountValueToProto(n.Organization, n.Budget, m), nil
}

func (s *budgetAccountValueServiceServer) ListBudgetAccountValues(ctx context.Context, req *gen.ListBudgetAccountValuesRequest) (*gen.ListBudgetAccountValuesResponse, error) {
	var pn gen.BudgetResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	c, err := svcfilter.ParseBudgetAccountValueFilter(req.Filter)
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
		return nil, &ServerError{Err: err, Status: statusFailedListBudgetAccountValues}
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
		return nil, &ServerError{Status: statusAccountValueRequired}
	}

	var n gen.BudgetAccountValueResourceName

	if err := n.UnmarshalString(req.AccountValue.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
	}

	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if !errors.Is(err, repository.ErrBudgetAccountValueNotFound) {
			return nil, &ServerError{Err: err, Status: statusFailedGetBudgetAccountValue}
		}

		if !req.AllowMissing {
			return nil, &ServerError{Err: err, Status: statusBudgetAccountValueNotFound}
		}

		// allow_missing: create the resource
		orgID, err := uuid.Parse(n.Organization)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
		}

		budgetID, err := uuid.Parse(n.Budget)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
		}

		accountID, err := uuid.Parse(req.AccountValue.AccountId)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidAccountID}
		}

		var val apd.Decimal

		if req.AccountValue.Value != nil {
			if _, _, err := val.SetString(req.AccountValue.Value.Value); err != nil {
				return nil, &ServerError{Err: err, Status: statusInvalidValue}
			}
		}

		newM, err := s.repo.Create(ctx, repository.CreateBudgetAccountValueParams{
			OrganizationID: orgID,
			BudgetID:       budgetID,
			AccountID:      accountID,
			Value:          val,
		})
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusFailedCreateBudgetAccountValue}
		}

		return BudgetAccountValueToProto(n.Organization, n.Budget, newM), nil
	}

	if req.AccountValue.Value != nil {
		if _, _, err := m.Value.SetString(req.AccountValue.Value.Value); err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidValue}
		}
	}

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateBudgetAccountValue}
	}

	return BudgetAccountValueToProto(n.Organization, n.Budget, m), nil
}

func (s *budgetAccountValueServiceServer) BatchUpdateBudgetAccountValues(ctx context.Context, req *gen.BatchUpdateBudgetAccountValuesRequest) (*gen.BatchUpdateBudgetAccountValuesResponse, error) {
	var pn gen.BudgetResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetName}
	}

	entries := make([]repository.UpsertEntry, 0, len(req.Requests))
	for _, r := range req.Requests {
		if r.AccountValue == nil {
			return nil, &ServerError{Status: statusAccountValueRequestRequired}
		}

		// Validate that any set resource name is consistent with the batch parent.
		if r.AccountValue.Name != "" {
			var n gen.BudgetAccountValueResourceName

			if err := n.UnmarshalString(r.AccountValue.Name); err != nil {
				return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
			}

			if n.Organization != pn.Organization || n.Budget != pn.Budget {
				return nil, &ServerError{Status: statusAccountValueNameMismatch}
			}
		}

		accountID, err := uuid.Parse(r.AccountValue.AccountId)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidAccountValueInBatch}
		}

		var val apd.Decimal

		if r.AccountValue.Value != nil {
			if _, _, err := val.SetString(r.AccountValue.Value.Value); err != nil {
				return nil, &ServerError{Err: err, Status: statusInvalidValueInBatch}
			}
		}

		entries = append(entries, repository.UpsertEntry{AccountID: accountID, Value: val})
	}

	ms, err := s.repo.BatchUpsert(ctx, orgID, budgetID, entries)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedBatchUpdateBudgetAccountValues}
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
		return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
	}

	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountValueName}
	}

	if err := s.repo.Delete(ctx, id); err != nil {
		if errors.Is(err, repository.ErrBudgetAccountValueNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetAccountValueNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteBudgetAccountValue}
	}

	return &emptypb.Empty{}, nil
}
