package services

import (
	"context"

	"errors"

	"github.com/google/uuid"
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
	statusInvalidParentTransactionName = status.New(codes.InvalidArgument, "invalid parent transaction name")
)

type transactionAccountAssignmentServiceServer struct {
	gen.UnimplementedTransactionAccountAssignmentServiceServer
	repo *repository.TransactionAccountAssignmentRepository
}

func newTransactionAccountAssignmentServiceServer(repo *repository.TransactionAccountAssignmentRepository) gen.TransactionAccountAssignmentServiceServer {
	return &transactionAccountAssignmentServiceServer{repo: repo}
}

func (s *transactionAccountAssignmentServiceServer) GetTransactionAccountAssignment(ctx context.Context, req *gen.GetTransactionAccountAssignmentRequest) (*gen.TransactionAccountAssignment, error) {
	var n gen.TransactionAccountAssignmentResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	m, err := s.repo.GetByID(ctx, assignID)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAssignment}
	}

	return TransactionAccountAssignmentToProto(n.Organization, n.Transaction, n.Assignment, m), nil
}

func (s *transactionAccountAssignmentServiceServer) ListTransactionAccountAssignments(ctx context.Context, req *gen.ListTransactionAccountAssignmentsRequest) (*gen.ListTransactionAccountAssignmentsResponse, error) {
	var pn gen.TransactionResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransactionName}
	}

	txID, err := uuid.Parse(pn.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransactionName}
	}

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

	orderExprs, _ := order.Resolve(orderBy, repository.TransactionAccountAssignmentOrderFieldMapper)

	params := repository.ListTransactionAccountAssignmentsParams{
		TransactionID: txID,
		Page:          int(offset/int64(pageSize)) + 1,
		PageSize:      pageSize,
		OrderBy:       orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListAssignments}
	}

	resp := &gen.ListTransactionAccountAssignmentsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Assignments = append(resp.Assignments, TransactionAccountAssignmentToProto(pn.Organization, pn.Transaction, m.CustomID, m))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *transactionAccountAssignmentServiceServer) CreateTransactionAccountAssignment(ctx context.Context, req *gen.CreateTransactionAccountAssignmentRequest) (*gen.TransactionAccountAssignment, error) {
	var pn gen.TransactionResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransactionName}
	}

	txID, err := uuid.Parse(pn.Transaction)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentTransactionName}
	}

	if req.Assignment == nil {
		return nil, &ServerError{Status: statusAssignmentRequired}
	}

	accountID, err := uuid.Parse(req.Assignment.AccountId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountID}
	}

	m, err := s.repo.Create(ctx, repository.CreateTransactionAccountAssignmentParams{
		TransactionID: txID,
		AccountID:     accountID,
		CustomID:      req.TransactionAccountAssignmentId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountAssignmentAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusAssignmentAlreadyExists}
		}

		if errors.Is(err, repository.ErrTransactionNotFound) {
			return nil, &ServerError{Err: err, Status: statusTransactionNotFound}
		}

		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateAssignment}
	}

	return TransactionAccountAssignmentToProto(pn.Organization, pn.Transaction, req.TransactionAccountAssignmentId, m), nil
}

func (s *transactionAccountAssignmentServiceServer) UpdateTransactionAccountAssignment(ctx context.Context, req *gen.UpdateTransactionAccountAssignmentRequest) (*gen.TransactionAccountAssignment, error) {
	if req.Assignment == nil {
		return nil, &ServerError{Status: statusAssignmentRequired}
	}

	var n gen.TransactionAccountAssignmentResourceName

	if err := n.UnmarshalString(req.Assignment.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	m, err := s.repo.GetByID(ctx, assignID)
	if err != nil {
		if errors.Is(err, repository.ErrTransactionAccountAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAssignment}
	}

	accountID, err := uuid.Parse(req.Assignment.AccountId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountID}
	}

	m.AccountID = accountID

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateAssignment}
	}

	return TransactionAccountAssignmentToProto(n.Organization, n.Transaction, n.Assignment, m), nil
}

func (s *transactionAccountAssignmentServiceServer) DeleteTransactionAccountAssignment(ctx context.Context, req *gen.DeleteTransactionAccountAssignmentRequest) (*emptypb.Empty, error) {
	var n gen.TransactionAccountAssignmentResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	if err := s.repo.Delete(ctx, assignID); err != nil {
		if errors.Is(err, repository.ErrTransactionAccountAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteAssignment}
	}

	return &emptypb.Empty{}, nil
}
