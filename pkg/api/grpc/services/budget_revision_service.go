package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type budgetRevisionServiceServer struct {
	gen.UnimplementedBudgetRevisionServiceServer
	repo       *repository.BudgetRevisionRepository
	budgetRepo *repository.BudgetRepository
}

func newBudgetRevisionServiceServer(
	repo *repository.BudgetRevisionRepository,
	budgetRepo *repository.BudgetRepository,
) gen.BudgetRevisionServiceServer {
	return &budgetRevisionServiceServer{
		repo:       repo,
		budgetRepo: budgetRepo,
	}
}

func (s *budgetRevisionServiceServer) GetBudgetRevision(ctx context.Context, req *gen.GetBudgetRevisionRequest) (*gen.BudgetRevision, error) {
	var n gen.BudgetRevisionResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget revision name")
	}
	revisionID, err := uuid.Parse(n.Revision)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget revision name")
	}
	m, err := s.repo.GetByID(ctx, revisionID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget revision not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget revision")
	}
	return BudgetRevisionToProto(m), nil
}

func (s *budgetRevisionServiceServer) ListBudgetRevisions(ctx context.Context, req *gen.ListBudgetRevisionsRequest) (*gen.ListBudgetRevisionsResponse, error) {
	var pn gen.BudgetResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
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

	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
	}
	orderExprs, _ := order.Resolve(orderBy, repository.BudgetRevisionOrderFieldMapper)

	params := repository.ListBudgetRevisionsParams{
		BudgetID: budgetID,
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list budget revisions")
	}

	resp := &gen.ListBudgetRevisionsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Revisions = append(resp.Revisions, BudgetRevisionToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *budgetRevisionServiceServer) CreateBudgetRevision(ctx context.Context, req *gen.CreateBudgetRevisionRequest) (*gen.BudgetRevision, error) {
	var pn gen.BudgetResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	if req.Revision == nil {
		return nil, status.Error(codes.InvalidArgument, "revision is required")
	}

	budget, err := s.budgetRepo.GetByID(ctx, budgetID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget")
	}

	params := repository.CreateWithSnapshotParams{
		OrganizationID:     budget.OrganizationID,
		BudgetID:           budgetID,
		DisplayName:        req.Revision.DisplayName,
		DisplayDescription: req.Revision.DisplayDescription,
		CustomID:           req.BudgetRevisionId,
	}
	if req.Revision.Date != nil {
		params.Date = protoDateToTime(req.Revision.Date)
	}
	m, err := s.repo.CreateWithSnapshot(ctx, params)
	if err != nil {
		if isDuplicateKey(err) {
			return nil, status.Error(codes.AlreadyExists, "budget revision with this ID already exists")
		}
		return nil, status.Error(codes.Internal, "failed to create budget revision")
	}

	return BudgetRevisionToProto(m), nil
}
