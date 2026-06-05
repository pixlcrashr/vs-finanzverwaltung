package services

import (
	"context"

	"github.com/google/uuid"
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
		return nil, status.Error(codes.InvalidArgument, "invalid assignment name")
	}
	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid assignment name")
	}
	m, err := s.repo.GetByID(ctx, assignID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "assignment not found")
		}
		return nil, status.Error(codes.Internal, "failed to get assignment")
	}
	return TransactionAccountAssignmentToProto(m), nil
}

func (s *transactionAccountAssignmentServiceServer) ListTransactionAccountAssignments(ctx context.Context, req *gen.ListTransactionAccountAssignmentsRequest) (*gen.ListTransactionAccountAssignmentsResponse, error) {
	var pn gen.TransactionResourceName
	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent transaction name")
	}
	txID, err := uuid.Parse(pn.Transaction)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent transaction name")
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

	// Parse order_by
	orderBy, err := ordering.ParseOrderBy(req)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid order_by: %v", err)
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
		return nil, status.Error(codes.Internal, "failed to list assignments")
	}

	resp := &gen.ListTransactionAccountAssignmentsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Assignments = append(resp.Assignments, TransactionAccountAssignmentToProto(m))
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
		return nil, status.Error(codes.InvalidArgument, "invalid parent transaction name")
	}
	txID, err := uuid.Parse(pn.Transaction)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent transaction name")
	}
	if req.Assignment == nil {
		return nil, status.Error(codes.InvalidArgument, "assignment is required")
	}
	accountID, err := uuid.Parse(req.Assignment.AccountId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_id")
	}
	m := &model.TransactionAccountAssignment{
		TransactionID: txID,
		AccountID:     accountID,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create assignment")
	}
	return TransactionAccountAssignmentToProto(m), nil
}

func (s *transactionAccountAssignmentServiceServer) UpdateTransactionAccountAssignment(ctx context.Context, req *gen.UpdateTransactionAccountAssignmentRequest) (*gen.TransactionAccountAssignment, error) {
	if req.Assignment == nil {
		return nil, status.Error(codes.InvalidArgument, "assignment is required")
	}
	var n gen.TransactionAccountAssignmentResourceName
	if err := n.UnmarshalString(req.Assignment.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid assignment name")
	}
	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid assignment name")
	}
	m, err := s.repo.GetByID(ctx, assignID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "assignment not found")
		}
		return nil, status.Error(codes.Internal, "failed to get assignment")
	}
	accountID, err := uuid.Parse(req.Assignment.AccountId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_id")
	}
	m.AccountID = accountID
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update assignment")
	}
	return TransactionAccountAssignmentToProto(m), nil
}

func (s *transactionAccountAssignmentServiceServer) DeleteTransactionAccountAssignment(ctx context.Context, req *gen.DeleteTransactionAccountAssignmentRequest) (*emptypb.Empty, error) {
	var n gen.TransactionAccountAssignmentResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid assignment name")
	}
	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid assignment name")
	}
	if err := s.repo.Delete(ctx, assignID); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "assignment not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete assignment")
	}
	return &emptypb.Empty{}, nil
}
