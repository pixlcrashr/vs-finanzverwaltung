package services

import (
	"context"
	"errors"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/cond"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

var (
	statusTransactionAssignmentRequired      = status.New(codes.InvalidArgument, "transaction_assignment is required")
	statusInvalidTransactionAssignmentName   = status.New(codes.InvalidArgument, "invalid transaction assignment name")
	statusInvalidParentTransaction           = status.New(codes.InvalidArgument, "invalid parent transaction")
	statusTransactionAssignmentNotFound      = status.New(codes.NotFound, "transaction assignment not found")
	statusTransactionAssignmentAlreadyExists = status.New(codes.AlreadyExists, "transaction assignment with this ID already exists")
	statusFailedGetTransactionAssignment     = status.New(codes.Internal, "failed to get transaction assignment")
	statusFailedListTransactionAssignments   = status.New(codes.Internal, "failed to list transaction assignments")
	statusFailedCreateTransactionAssignment  = status.New(codes.Internal, "failed to create transaction assignment")
	statusFailedDeleteTransactionAssignment  = status.New(codes.Internal, "failed to delete transaction assignment")
)

type transactionAssignmentServiceServer struct {
	gen.UnimplementedTransactionAssignmentServiceServer
	repo             *repository.TransactionAssignmentRepository
	accountRepo      *repository.AccountRepository
	organizationRepo *repository.OrganizationRepository
	enforcer         *authz.Enforcer
}

func newTransactionAssignmentServiceServer(repo *repository.TransactionAssignmentRepository, accountRepo *repository.AccountRepository, enforcer *authz.Enforcer) gen.TransactionAssignmentServiceServer {
	return &transactionAssignmentServiceServer{repo: repo, accountRepo: accountRepo, enforcer: enforcer}
}

func (s *transactionAssignmentServiceServer) GetTransactionAssignment(ctx context.Context, req *gen.GetTransactionAssignmentRequest) (*gen.TransactionAssignment, error) {
	var n gen.TransactionAssignmentResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAssignmentName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceTransactions, authz.ActionRead, authz.OrgDomain(n.Organization)); err != nil {
		return nil, authError(err)
	}

	assignmentID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAssignmentName}
	}

	m, err := s.repo.GetByID(ctx, assignmentID)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetTransactionAssignment}
	}

	a, err := s.accountRepo.GetByID(ctx, m.AccountID)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedGetTransactionAssignment}
	}

	return TransactionAssignmentToProto(n.TransactionResourceName(), m, a), nil
}

func (s *transactionAssignmentServiceServer) ListTransactionAssignments(ctx context.Context, req *gen.ListTransactionAssignmentsRequest) (*gen.ListTransactionAssignmentsResponse, error) {
	var pn gen.TransactionResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransaction}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceTransactions, authz.ActionRead, authz.OrgDomain(pn.Organization)); err != nil {
		return nil, authError(err)
	}

	transID, err := uuid.Parse(pn.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransaction}
	}

	c, err := svcfilter.ParseTransactionAssignmentFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
	}

	// Resolve "account" resource names in the filter to account UUIDs.
	// The filter field is "account" (a resource_reference), but the DB column is "account_id" (UUID).
	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransaction}
	}
	c = cond.Transform(c, func(field string, value interface{}) (string, interface{}, bool) {
		if field != "account" {
			return field, value, true
		}
		accountName, ok := value.(string)
		if !ok {
			return field, value, true
		}
		var accountRN gen.AccountResourceName
		if err := accountRN.UnmarshalString(accountName); err != nil {
			return field, value, false
		}
		a, err := s.accountRepo.GetByCustomID(ctx, orgID, accountRN.Account)
		if err != nil {
			return field, value, false
		}
		return "account", a.ID.String(), true
	})

	offset, err := pagetoken.Decode(req.PageToken)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidPageToken}
	}

	pageSize := normalizePageSize(req.PageSize)

	// Parse order_by
	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrderBy}
	}

	orderExprs, _ := order.Resolve(orderBy, repository.TransactionAssignmentOrderFieldMapper)

	params := repository.ListTransactionAssignmentsParams{
		TransactionID: transID,
		Page:          int(offset/int64(pageSize)) + 1,
		PageSize:      pageSize,
		Cond:          c,
		OrderBy:       orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListTransactionAssignments}
	}

	resp := &gen.ListTransactionAssignmentsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Assignments = append(resp.Assignments, TransactionAssignmentToProto(pn, m, &model.Account{CustomID: m.AccountID.String()})) // TODO: very unimportant: replace with custom ID of account
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *transactionAssignmentServiceServer) CreateTransactionAssignment(ctx context.Context, req *gen.CreateTransactionAssignmentRequest) (*gen.TransactionAssignment, error) {
	var pn gen.TransactionResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransaction}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceTransactions, authz.ActionCreate, authz.OrgDomain(pn.Organization)); err != nil {
		return nil, authError(err)
	}

	transID, err := uuid.Parse(pn.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransaction}
	}

	if req.Assignment == nil {
		return nil, &ServerError{Status: statusTransactionAssignmentRequired}
	}

	var accountResourceName gen.AccountResourceName
	if err := accountResourceName.UnmarshalString(req.Assignment.Account); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountID}
	}

	orgID, err := uuid.Parse(pn.Organization)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransaction}
	}

	o, err := s.organizationRepo.GetByID(ctx, orgID)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusOrganizationNotFound}
	}

	a, err := s.accountRepo.GetByCustomID(ctx, o.ID, accountResourceName.Account)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusAccountNotFound}
	}

	m, err := s.repo.Create(ctx, repository.CreateTransactionAssignmentParams{
		OrganizationID: o.ID,
		TransactionID:  transID,
		AccountID:      a.ID,
		Value:          decimalProtoToApd(req.Assignment.Value),
	})
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAssignmentAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusTransactionAssignmentAlreadyExists}
		}

		if errors.Is(err, repository.ErrTransactionNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateTransactionAssignment}
	}

	return TransactionAssignmentToProto(pn, m, a), nil
}

func (s *transactionAssignmentServiceServer) DeleteTransactionAssignment(ctx context.Context, req *gen.DeleteTransactionAssignmentRequest) (*emptypb.Empty, error) {
	var n gen.TransactionAssignmentResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAssignmentName}
	}

	if err := authz.CheckOrg(ctx, s.enforcer, authz.ResourceTransactions, authz.ActionDelete, authz.OrgDomain(n.Organization)); err != nil {
		return nil, authError(err)
	}

	assignmentID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidTransactionAssignmentName}
	}

	if err := s.repo.Delete(ctx, assignmentID); err != nil {
		if errors.Is(err, repository.ErrTransactionAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteTransactionAssignment}
	}

	return &emptypb.Empty{}, nil
}

// decimalProtoToApd converts a gen.Decimal to apd.Decimal
func decimalProtoToApd(d *gen.Decimal) apd.Decimal {
	if d == nil {
		return apd.Decimal{}
	}
	var result apd.Decimal
	result.SetString(d.Value)
	return result
}
