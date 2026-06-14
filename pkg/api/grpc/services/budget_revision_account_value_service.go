package services

import (
	"context"

	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type budgetRevisionAccountValueServiceServer struct {
	gen.UnimplementedBudgetRevisionAccountValueServiceServer
	repo *repository.BudgetRevisionAccountValueRepository
}

func newBudgetRevisionAccountValueServiceServer(repo *repository.BudgetRevisionAccountValueRepository) gen.BudgetRevisionAccountValueServiceServer {
	return &budgetRevisionAccountValueServiceServer{repo: repo}
}

func (s *budgetRevisionAccountValueServiceServer) GetBudgetRevisionAccountValue(ctx context.Context, req *gen.GetBudgetRevisionAccountValueRequest) (*gen.BudgetRevisionAccountValue, error) {
	var n gen.BudgetRevisionAccountValueResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget revision account value name")
	}
	id, err := uuid.Parse(n.AccountValue)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget revision account value name")
	}
	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget revision account value not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget revision account value")
	}
	return BudgetRevisionAccountValueToProto(n.Organization, n.Budget, n.Revision, m), nil
}

func (s *budgetRevisionAccountValueServiceServer) ListBudgetRevisionAccountValues(ctx context.Context, req *gen.ListBudgetRevisionAccountValuesRequest) (*gen.ListBudgetRevisionAccountValuesResponse, error) {
	var pn gen.BudgetRevisionResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent revision name")
	}
	revisionID, err := uuid.Parse(pn.Revision)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent revision name")
	}

	c, err := svcfilter.ParseBudgetRevisionAccountValueFilter(req.Filter)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid filter: %v", err)
	}

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid page_token")
	}

	pageSize := int(req.PageSize)
	if pageSize <= 0 {
		pageSize = 50
	} else if pageSize > 200 {
		pageSize = 200
	}

	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
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
		return nil, status.Error(codes.Internal, "failed to list budget revision account values")
	}

	resp := &gen.ListBudgetRevisionAccountValuesResponse{TotalSize: total}
	for _, m := range ms {
		resp.AccountValues = append(resp.AccountValues, BudgetRevisionAccountValueToProto(pn.Organization, pn.Budget, pn.Revision, m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}
