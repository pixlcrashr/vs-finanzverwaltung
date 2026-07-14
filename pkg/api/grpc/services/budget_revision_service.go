package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	statusInvalidBudgetRevisionName       = status.New(codes.InvalidArgument, "invalid budget revision name")
	statusInvalidParentBudgetRevisionName = status.New(codes.InvalidArgument, "invalid parent budget name")
	statusBudgetRevisionNotFound          = status.New(codes.NotFound, "budget revision not found")
	statusBudgetRevisionAlreadyExists     = status.New(codes.AlreadyExists, "budget revision with this ID already exists")
	statusRevisionRequired                = status.New(codes.InvalidArgument, "revision is required")
	statusFailedGetBudgetRevision         = status.New(codes.Internal, "failed to get budget revision")
	statusFailedListBudgetRevisions       = status.New(codes.Internal, "failed to list budget revisions")
	statusFailedCreateBudgetRevision      = status.New(codes.Internal, "failed to create budget revision")
)

type budgetRevisionServiceServer struct {
	gen.UnimplementedBudgetRevisionServiceServer
	repo       *repository.BudgetRevisionRepository
	budgetRepo *repository.BudgetRepository
	enforcer   *authz.Enforcer
}

func newBudgetRevisionServiceServer(
	repo *repository.BudgetRevisionRepository,
	budgetRepo *repository.BudgetRepository,
	enforcer *authz.Enforcer,
) gen.BudgetRevisionServiceServer {
	return &budgetRevisionServiceServer{
		repo:       repo,
		budgetRepo: budgetRepo,
		enforcer:   enforcer,
	}
}

func (s *budgetRevisionServiceServer) GetBudgetRevision(ctx context.Context, req *gen.GetBudgetRevisionRequest) (*gen.BudgetRevision, error) {
	var n gen.BudgetRevisionResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidBudgetRevisionName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionRead, authz.OrgDomain(n.Organization)); err != nil {
		return nil, authError(err)
	}

	revisionID, err := uuid.Parse(n.Revision)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidBudgetRevisionName}
	}

	m, err := s.repo.GetByID(ctx, revisionID)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetRevisionNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetRevisionNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetBudgetRevision}
	}

	return BudgetRevisionToProto(n.BudgetResourceName(), m), nil
}

func (s *budgetRevisionServiceServer) ListBudgetRevisions(ctx context.Context, req *gen.ListBudgetRevisionsRequest) (*gen.ListBudgetRevisionsResponse, error) {
	var pn gen.BudgetResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetRevisionName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionRead, authz.OrgDomain(pn.Organization)); err != nil {
		return nil, authError(err)
	}

	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetRevisionName}
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

	orderExprs, _ := order.Resolve(orderBy, repository.BudgetRevisionOrderFieldMapper)

	params := repository.ListBudgetRevisionsParams{
		BudgetID: budgetID,
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListBudgetRevisions}
	}

	resp := &gen.ListBudgetRevisionsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Revisions = append(resp.Revisions, BudgetRevisionToProto(pn, m))
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
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetRevisionName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceBudgets, authz.ActionCreate, authz.OrgDomain(pn.Organization)); err != nil {
		return nil, authError(err)
	}

	budgetID, err := uuid.Parse(pn.Budget)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentBudgetRevisionName}
	}

	if req.Revision == nil {
		return nil, &ServerError{Status: statusRevisionRequired}
	}

	budget, err := s.budgetRepo.GetByID(ctx, budgetID)
	if err != nil {
		if errors.Is(err, repository.ErrBudgetNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetBudget}
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
		if errors.Is(err, repository.ErrBudgetRevisionAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusBudgetRevisionAlreadyExists}
		}

		if errors.Is(err, repository.ErrBudgetNotFound) {
			return nil, &ServerError{Err: err, Status: statusBudgetNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateBudgetRevision}
	}

	return BudgetRevisionToProto(pn, m), nil
}
