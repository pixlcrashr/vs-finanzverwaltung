package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
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
	statusInvalidUserName     = status.New(codes.InvalidArgument, "invalid user name")
	statusUserNotFound        = status.New(codes.NotFound, "user not found")
	statusFailedGetUser       = status.New(codes.Internal, "failed to get user")
	statusFailedListUsers     = status.New(codes.Internal, "failed to list users")
	statusFailedCheckPerms    = status.New(codes.Internal, "failed to check permissions")
	statusInvalidOrgName      = status.New(codes.InvalidArgument, "invalid organization name")
	statusNoPermissions       = status.New(codes.InvalidArgument, "at least one permission must be specified")
	statusTooManyBatchEntries = status.New(codes.InvalidArgument, "too many batch entries (max 100)")
)

type userServiceServer struct {
	gen.UnimplementedUserServiceServer
	repo     *repository.UserRepository
	enforcer *authz.Enforcer
}

func newUserServiceServer(repo *repository.UserRepository, enforcer *authz.Enforcer) gen.UserServiceServer {
	return &userServiceServer{repo: repo, enforcer: enforcer}
}

func (s *userServiceServer) GetUser(ctx context.Context, req *gen.GetUserRequest) (*gen.User, error) {
	var n gen.UserResourceName
	if err := n.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidUserName}
	}

	if err := authz.Check(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead, authz.GlobalDomain); err != nil {
		return nil, authError(err)
	}

	id, err := uuid.Parse(n.User)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidUserName}
	}

	m, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, &ServerError{Err: err, Status: statusUserNotFound}
		}
		return nil, &ServerError{Err: err, Status: statusFailedGetUser}
	}

	return UserToProto(m), nil
}

func (s *userServiceServer) ListUsers(ctx context.Context, req *gen.ListUsersRequest) (*gen.ListUsersResponse, error) {
	if err := authz.Check(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead, authz.GlobalDomain); err != nil {
		return nil, authError(err)
	}

	c, err := filter.ParseUserFilter(req.Filter)
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

	orderExprs, _ := order.Resolve(orderBy, repository.UserOrderFieldMapper)

	params := repository.ListUsersParams{
		Cond:     c,
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		OrderBy:  orderExprs,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedListUsers}
	}

	resp := &gen.ListUsersResponse{TotalSize: total}
	for _, m := range ms {
		resp.Users = append(resp.Users, UserToProto(m))
	}

	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}

	return resp, nil
}

func (s *userServiceServer) CheckUserOrganizationPermissions(ctx context.Context, req *gen.CheckUserOrganizationPermissionsRequest) (*gen.CheckUserOrganizationPermissionsResponse, error) {
	if err := authz.Check(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead, authz.GlobalDomain); err != nil {
		return nil, authError(err)
	}

	var un gen.UserResourceName
	if err := un.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidUserName}
	}

	var on gen.OrganizationResourceName
	if err := on.UnmarshalString(req.Organization); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidOrgName}
	}

	if len(req.Permissions) == 0 {
		return nil, &ServerError{Status: statusNoPermissions}
	}

	permitted, err := s.checkPermissions(un.User, on.Organization, req.Permissions)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedCheckPerms}
	}

	return &gen.CheckUserOrganizationPermissionsResponse{
		Organization: req.Organization,
		Permitted:    permitted,
	}, nil
}

func (s *userServiceServer) BatchCheckUserOrganizationPermissions(ctx context.Context, req *gen.BatchCheckUserOrganizationPermissionsRequest) (*gen.BatchCheckUserOrganizationPermissionsResponse, error) {
	if err := authz.Check(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead, authz.GlobalDomain); err != nil {
		return nil, authError(err)
	}

	var un gen.UserResourceName
	if err := un.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidUserName}
	}

	if len(req.Requests) > 100 {
		return nil, &ServerError{Status: statusTooManyBatchEntries}
	}

	resp := &gen.BatchCheckUserOrganizationPermissionsResponse{
		Results: make([]*gen.CheckUserOrganizationPermissionsResponse, 0, len(req.Requests)),
	}

	for _, r := range req.Requests {
		var on gen.OrganizationResourceName
		if err := on.UnmarshalString(r.Organization); err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidOrgName}
		}

		permitted, err := s.checkPermissions(un.User, on.Organization, r.Permissions)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusFailedCheckPerms}
		}

		resp.Results = append(resp.Results, &gen.CheckUserOrganizationPermissionsResponse{
			Organization: r.Organization,
			Permitted:    permitted,
		})
	}

	return resp, nil
}

func (s *userServiceServer) CheckUserPermissions(ctx context.Context, req *gen.CheckUserPermissionsRequest) (*gen.CheckUserPermissionsResponse, error) {
	if err := authz.Check(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead, authz.GlobalDomain); err != nil {
		return nil, authError(err)
	}

	var un gen.UserResourceName
	if err := un.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidUserName}
	}

	if len(req.Permissions) == 0 {
		return nil, &ServerError{Status: statusNoPermissions}
	}

	permitted, err := s.checkPermissions(un.User, "", req.Permissions)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedCheckPerms}
	}

	return &gen.CheckUserPermissionsResponse{
		Permitted: permitted,
	}, nil
}

func (s *userServiceServer) BatchCheckUserPermissions(ctx context.Context, req *gen.BatchCheckUserPermissionsRequest) (*gen.BatchCheckUserPermissionsResponse, error) {
	if err := authz.Check(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead, authz.GlobalDomain); err != nil {
		return nil, authError(err)
	}

	if len(req.Requests) > 100 {
		return nil, &ServerError{Status: statusTooManyBatchEntries}
	}

	resp := &gen.BatchCheckUserPermissionsResponse{
		Results: make([]*gen.CheckUserPermissionsResponse, 0, len(req.Requests)),
	}

	for _, r := range req.Requests {
		var un gen.UserResourceName
		if err := un.UnmarshalString(r.Name); err != nil {
			return nil, &ServerError{Err: err, Status: statusInvalidUserName}
		}

		if len(r.Permissions) == 0 {
			return nil, &ServerError{Status: statusNoPermissions}
		}

		permitted, err := s.checkPermissions(un.User, "", r.Permissions)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusFailedCheckPerms}
		}

		resp.Results = append(resp.Results, &gen.CheckUserPermissionsResponse{
			Permitted: permitted,
		})
	}

	return resp, nil
}

// checkPermissions evaluates the requested permissions against casbin.
// Global permissions (users, groups, settings) are checked with an empty
// domain; org-scoped permissions use the organization custom ID as domain.
func (s *userServiceServer) checkPermissions(userID, orgCustomID string, requested []gen.Permission) ([]gen.Permission, error) {
	var permitted []gen.Permission

	for _, pp := range requested {
		p, ok := authz.PermissionFromProto(pp)
		if !ok {
			continue
		}

		dom := orgCustomID
		if authz.GlobalResources[p.Resource] {
			dom = authz.GlobalDomain
		}

		allowed, err := s.enforcer.Enforce(userID, dom, p.Resource, p.Action)
		if err != nil {
			return nil, err
		}

		if allowed {
			permitted = append(permitted, pp)
		}
	}

	return permitted, nil
}
