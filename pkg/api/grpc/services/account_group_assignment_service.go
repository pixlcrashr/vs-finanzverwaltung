package services

import (
	"context"

	"github.com/google/uuid"
	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type accountGroupAssignmentServiceServer struct {
	gen.UnimplementedAccountGroupAssignmentServiceServer
	repo *repository.AccountGroupAssignmentRepository
}

func newAccountGroupAssignmentServiceServer(repo *repository.AccountGroupAssignmentRepository) gen.AccountGroupAssignmentServiceServer {
	return &accountGroupAssignmentServiceServer{repo: repo}
}

func (s *accountGroupAssignmentServiceServer) GetAccountGroupAssignment(ctx context.Context, req *gen.GetAccountGroupAssignmentRequest) (*gen.AccountGroupAssignment, error) {
	assignID, err := lastSegment(req.Name)
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
	return AccountGroupAssignmentToProto(m), nil
}

func (s *accountGroupAssignmentServiceServer) ListAccountGroupAssignments(ctx context.Context, req *gen.ListAccountGroupAssignmentsRequest) (*gen.ListAccountGroupAssignmentsResponse, error) {
	groupID, err := idFromName(req.Parent, "accountGroups/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent account_group name")
	}

	c, err := svcfilter.ParseAccountGroupAssignmentFilter(req.Filter)
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

	params := repository.ListAccountGroupAssignmentsParams{
		AccountGroupID: groupID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list assignments")
	}

	resp := &gen.ListAccountGroupAssignmentsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Assignments = append(resp.Assignments, AccountGroupAssignmentToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *accountGroupAssignmentServiceServer) CreateAccountGroupAssignment(ctx context.Context, req *gen.CreateAccountGroupAssignmentRequest) (*gen.AccountGroupAssignment, error) {
	groupID, err := idFromName(req.Parent, "accountGroups/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent account_group name")
	}
	if req.Assignment == nil {
		return nil, status.Error(codes.InvalidArgument, "assignment is required")
	}
	accountID, err := uuid.Parse(req.Assignment.AccountId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid account_id")
	}
	m := &model.AccountGroupAssignment{
		AccountGroupID: groupID,
		AccountID:      accountID,
		Negate:         req.Assignment.Negate,
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create assignment")
	}
	return AccountGroupAssignmentToProto(m), nil
}

func (s *accountGroupAssignmentServiceServer) UpdateAccountGroupAssignment(ctx context.Context, req *gen.UpdateAccountGroupAssignmentRequest) (*gen.AccountGroupAssignment, error) {
	if req.Assignment == nil {
		return nil, status.Error(codes.InvalidArgument, "assignment is required")
	}
	assignID, err := lastSegment(req.Assignment.Name)
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
	m.Negate = req.Assignment.Negate
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update assignment")
	}
	return AccountGroupAssignmentToProto(m), nil
}

func (s *accountGroupAssignmentServiceServer) DeleteAccountGroupAssignment(ctx context.Context, req *gen.DeleteAccountGroupAssignmentRequest) (*emptypb.Empty, error) {
	assignID, err := lastSegment(req.Name)
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
