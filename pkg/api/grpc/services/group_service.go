package services

import (
	"context"
	"errors"

	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/query/order"
	"github.com/theater-improrama/go-utils/optional"
	"go.einride.tech/aip/ordering"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

var (
	statusGroupRequired      = status.New(codes.InvalidArgument, "group is required")
	statusInvalidGroupName   = status.New(codes.InvalidArgument, "invalid group name")
	statusGroupNotFound      = status.New(codes.NotFound, "group not found")
	statusGroupAlreadyExists = status.New(codes.AlreadyExists, "group with this ID already exists")
	statusFailedGetGroup     = status.New(codes.Internal, "failed to get group")
	statusFailedListGroups   = status.New(codes.Internal, "failed to list groups")
	statusFailedCreateGroup  = status.New(codes.Internal, "failed to create group")
	statusFailedUpdateGroup  = status.New(codes.Internal, "failed to update group")
	statusFailedDeleteGroup  = status.New(codes.Internal, "failed to delete group")
)

type groupServiceServer struct {
	gen.UnimplementedGroupServiceServer
	repo *repository.UserGroupRepository
}

func newGroupServiceServer(repo *repository.UserGroupRepository) gen.GroupServiceServer {
	return &groupServiceServer{repo: repo}
}

func (s *groupServiceServer) GetGroup(ctx context.Context, req *gen.GetGroupRequest) (*gen.Group, error) {
	var n gen.GroupResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidGroupName}
	}

	m, err := s.repo.GetByCustomID(ctx, n.Group)
	if err != nil {
		if errors.Is(err, repository.ErrUserGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusGroupNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedGetGroup}
	}

	policies, err := s.buildPoliciesProto(m)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedGetGroup}
	}

	return UserGroupToProto(m, policies), nil
}

func (s *groupServiceServer) ListGroups(ctx context.Context, req *gen.ListGroupsRequest) (*gen.ListGroupsResponse, error) {
	c, err := filter.ParseUserGroupFilter(req.Filter)
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

	orderExprs, _ := order.Resolve(orderBy, repository.UserGroupOrderFieldMapper)

	params := repository.ListUserGroupsParams{
		Cond:     c,
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListGroups}
	}

	resp := &gen.ListGroupsResponse{TotalSize: total}
	for _, m := range ms {
		policies, err := s.buildPoliciesProto(m)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusFailedListGroups}
		}
		resp.Groups = append(resp.Groups, UserGroupToProto(m, policies))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *groupServiceServer) CreateGroup(ctx context.Context, req *gen.CreateGroupRequest) (*gen.Group, error) {
	if req.Group == nil {
		return nil, &ServerError{Status: statusGroupRequired}
	}

	orgPolicies := s.parseOrgPolicies(req.Group.OrganizationPolicies)

	params := repository.CreateUserGroupParams{
		DisplayName:          req.Group.DisplayName,
		DisplayDescription:   req.Group.DisplayDescription,
		CustomID:             req.GroupId,
		OrganizationPolicies: orgPolicies,
	}

	m, err := s.repo.Create(ctx, params)
	if err != nil {
		if errors.Is(err, repository.ErrUserGroupAlreadyExists) {
			return nil, &ServerError{Err: err, Status: statusGroupAlreadyExists}
		}
		return nil, &ServerError{Err: err, Status: statusFailedCreateGroup}
	}

	policies, err := s.buildPoliciesProto(m)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedCreateGroup}
	}

	return UserGroupToProto(m, policies), nil
}

func (s *groupServiceServer) UpdateGroup(ctx context.Context, req *gen.UpdateGroupRequest) (*gen.Group, error) {
	if req.Group == nil {
		return nil, &ServerError{Status: statusGroupRequired}
	}

	var n gen.GroupResourceName
	if err := n.UnmarshalString(req.Group.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidGroupName}
	}

	m, err := s.repo.GetByCustomID(ctx, n.Group)
	if err != nil {
		if errors.Is(err, repository.ErrUserGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusGroupNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedGetGroup}
	}

	updateParams := repository.UpdateUserGroupParams{}

	if req.Group.DisplayName != "" {
		updateParams.DisplayName = optional.From(req.Group.DisplayName)
	}
	if req.Group.DisplayDescription != "" {
		updateParams.DisplayDescription = optional.From(req.Group.DisplayDescription)
	}
	if req.Group.OrganizationPolicies != nil {
		orgPolicies := s.parseOrgPolicies(req.Group.OrganizationPolicies)
		updateParams.OrganizationPolicies = optional.From(orgPolicies)
	}

	if err := s.repo.Update(ctx, m.ID, updateParams); err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateGroup}
	}

	// Refresh the model after update
	m, err = s.repo.GetByID(ctx, m.ID)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateGroup}
	}

	policies, err := s.buildPoliciesProto(m)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedUpdateGroup}
	}

	return UserGroupToProto(m, policies), nil
}

func (s *groupServiceServer) DeleteGroup(ctx context.Context, req *gen.DeleteGroupRequest) (*emptypb.Empty, error) {
	var n gen.GroupResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidGroupName}
	}

	m, err := s.repo.GetByCustomID(ctx, n.Group)
	if err != nil {
		if errors.Is(err, repository.ErrUserGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusGroupNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedDeleteGroup}
	}

	if err := s.repo.Delete(ctx, m.ID); err != nil {
		if errors.Is(err, repository.ErrUserGroupNotFound) {
			return nil, &ServerError{Err: err, Status: statusGroupNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedDeleteGroup}
	}

	return &emptypb.Empty{}, nil
}

// parseOrgPolicies converts proto GroupOrganizationPolicy slices into the
// map[orgCustomID][]gen.Permission format expected by the repository.
func (s *groupServiceServer) parseOrgPolicies(policies []*gen.GroupOrganizationPolicy) map[string][]gen.Permission {
	result := make(map[string][]gen.Permission, len(policies))
	for _, pol := range policies {
		var on gen.OrganizationResourceName
		if err := on.UnmarshalString(pol.Organization); err != nil {
			continue
		}
		result[on.Organization] = pol.Permissions
	}
	return result
}

// buildPoliciesProto reads casbin policies for a group and converts them
// into proto GroupOrganizationPolicy slices.
func (s *groupServiceServer) buildPoliciesProto(m *model.UserGroup) ([]*gen.GroupOrganizationPolicy, error) {
	policyMap, err := s.repo.GetOrganizationPolicies(m.ID.String())
	if err != nil {
		return nil, err
	}

	var policies []*gen.GroupOrganizationPolicy
	for orgCustomID, perms := range policyMap {
		policies = append(policies, &gen.GroupOrganizationPolicy{
			Organization: gen.OrganizationResourceName{Organization: orgCustomID}.String(),
			Permissions:  perms,
		})
	}
	return policies, nil
}
