package services

import (
	"context"
	"errors"

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
	statusInvalidParentAccountGroupName = status.New(codes.InvalidArgument, "invalid parent account_group name")
)

type accountGroupAssignmentServiceServer struct {
	gen.UnimplementedAccountGroupAssignmentServiceServer
	repo *repository.AccountGroupAssignmentRepository
}

func newAccountGroupAssignmentServiceServer(repo *repository.AccountGroupAssignmentRepository) gen.AccountGroupAssignmentServiceServer {
	return &accountGroupAssignmentServiceServer{repo: repo}
}

func (s *accountGroupAssignmentServiceServer) GetAccountGroupAssignment(ctx context.Context, req *gen.GetAccountGroupAssignmentRequest) (*gen.AccountGroupAssignment, error) {
	var n gen.AccountGroupAssignmentResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	m, err := s.repo.GetByID(ctx, assignID)
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAssignment}
	}

	return AccountGroupAssignmentToProto(n.Organization, n.AccountGroup, m), nil
}

func (s *accountGroupAssignmentServiceServer) ListAccountGroupAssignments(ctx context.Context, req *gen.ListAccountGroupAssignmentsRequest) (*gen.ListAccountGroupAssignmentsResponse, error) {
	var pn gen.AccountGroupResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentAccountGroupName}
	}

	groupID, err := uuid.Parse(pn.AccountGroup)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentAccountGroupName}
	}

	c, err := svcfilter.ParseAccountGroupAssignmentFilter(req.Filter)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidFilter}
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

	orderExprs, _ := order.Resolve(orderBy, repository.AccountGroupAssignmentOrderFieldMapper)

	params := repository.ListAccountGroupAssignmentsParams{
		AccountGroupID: groupID,
		Page:           int(offset/int64(pageSize)) + 1,
		PageSize:       pageSize,
		Cond:           c,
		OrderBy:        orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListAssignments}
	}

	resp := &gen.ListAccountGroupAssignmentsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Assignments = append(resp.Assignments, AccountGroupAssignmentToProto(pn.Organization, pn.AccountGroup, m))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *accountGroupAssignmentServiceServer) CreateAccountGroupAssignment(ctx context.Context, req *gen.CreateAccountGroupAssignmentRequest) (*gen.AccountGroupAssignment, error) {
	var pn gen.AccountGroupResourceName

	if err := pn.UnmarshalString(req.Parent); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentAccountGroupName}
	}

	groupID, err := uuid.Parse(pn.AccountGroup)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidParentAccountGroupName}
	}

	if req.Assignment == nil {
		return nil, &ServerError{Status: statusAssignmentRequired}
	}

	accountID, err := uuid.Parse(req.Assignment.AccountId)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAccountID}
	}

	m, err := s.repo.Create(ctx, repository.CreateAccountGroupAssignmentParams{
		AccountGroupID: groupID,
		AccountID:      accountID,
		Negate:         req.Assignment.Negate,
		CustomID:       req.AccountGroupAssignmentId,
	})
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupAssignmentAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusAssignmentAlreadyExists}
		}

		if errors.Is(err, repository.ErrAccountGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountGroupNotFound}
		}

		if errors.Is(err, repository.ErrAccountNotFound) {
			return nil, &ServerError{Err: err, Status: statusAccountNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedCreateAssignment}
	}

	return AccountGroupAssignmentToProto(pn.Organization, pn.AccountGroup, m), nil
}

func (s *accountGroupAssignmentServiceServer) UpdateAccountGroupAssignment(ctx context.Context, req *gen.UpdateAccountGroupAssignmentRequest) (*gen.AccountGroupAssignment, error) {
	if req.Assignment == nil {
		return nil, &ServerError{Status: statusAssignmentRequired}
	}

	var n gen.AccountGroupAssignmentResourceName

	if err := n.UnmarshalString(req.Assignment.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	m, err := s.repo.GetByID(ctx, assignID)
	if err != nil {
		if errors.Is(err, repository.ErrAccountGroupAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedGetAssignment}
	}

	m.Negate = req.Assignment.Negate

	if err := s.repo.Update(ctx, m); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateAssignment}
	}

	return AccountGroupAssignmentToProto(n.Organization, n.AccountGroup, m), nil
}

func (s *accountGroupAssignmentServiceServer) DeleteAccountGroupAssignment(ctx context.Context, req *gen.DeleteAccountGroupAssignmentRequest) (*emptypb.Empty, error) {
	var n gen.AccountGroupAssignmentResourceName

	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	assignID, err := uuid.Parse(n.Assignment)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidAssignmentName}
	}

	if err := s.repo.Delete(ctx, assignID); err != nil {
		if errors.Is(err, repository.ErrAccountGroupAssignmentNotFound) {
			return nil, &ServerError{Err: err, Status: statusAssignmentNotFound}
		}

		return nil, &ServerError{Err: err, Status: statusFailedDeleteAssignment}
	}

	return &emptypb.Empty{}, nil
}
