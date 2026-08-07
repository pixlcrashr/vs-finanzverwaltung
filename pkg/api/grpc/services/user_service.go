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
	statusInvalidDomain       = status.New(codes.InvalidArgument, "invalid domain")
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

	if err := authz.CheckGlobal(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead); err != nil {
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
	if err := authz.CheckGlobal(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead); err != nil {
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

func (s *userServiceServer) CheckUserPermissions(ctx context.Context, req *gen.CheckUserPermissionsRequest) (*gen.CheckUserPermissionsResponse, error) {
	if err := authz.CheckGlobal(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead); err != nil {
		return nil, authError(err)
	}

	var un gen.UserResourceName
	if err := un.UnmarshalString(req.Name); err != nil {
		return nil, &ServerError{Err: err, Status: statusInvalidUserName}
	}

	// Domain is optional. When empty, permissions are checked globally.
	// When set, it is used directly as the casbin domain (e.g. "organizations/{id}").
	if len(req.Permissions) == 0 {
		return nil, &ServerError{Status: statusNoPermissions}
	}

	permitted, err := s.checkPermissions(un.User, req.Domain, req.Permissions)
	if err != nil {
		return nil, &ServerError{Err: err, Status: statusFailedCheckPerms}
	}

	return &gen.CheckUserPermissionsResponse{
		Domain:    req.Domain,
		Permitted: permitted,
	}, nil
}

func (s *userServiceServer) BatchCheckUserPermissions(ctx context.Context, req *gen.BatchCheckUserPermissionsRequest) (*gen.BatchCheckUserPermissionsResponse, error) {
	if err := authz.CheckGlobal(ctx, s.enforcer, authz.ResourceUsers, authz.ActionRead); err != nil {
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

		permitted, err := s.checkPermissions(un.User, r.Domain, r.Permissions)
		if err != nil {
			return nil, &ServerError{Err: err, Status: statusFailedCheckPerms}
		}

		resp.Results = append(resp.Results, &gen.CheckUserPermissionsResponse{
			Domain:    r.Domain,
			Permitted: permitted,
		})
	}

	return resp, nil
}

// checkPermissions evaluates the requested permissions against casbin.
// Global permissions (users, groups, settings) are always checked with an
// empty domain. Org-scoped permissions use the provided domain string
// directly (e.g. "organizations/{id}").
func (s *userServiceServer) checkPermissions(userID, domain string, requested []string) ([]string, error) {
	var permitted []string

	for _, permStr := range requested {
		p, ok := authz.ParsePermission(permStr)
		if !ok {
			continue
		}

		dom := domain
		if dom == "" {
			dom = authz.GlobalDomain
		}
		if authz.GlobalResources[p.Resource] {
			dom = authz.GlobalDomain
		}

		allowed, err := s.enforcer.Enforce(userID, dom, p.Resource, p.Action)
		if err != nil {
			return nil, err
		}

		if allowed {
			permitted = append(permitted, permStr)
		}
	}

	return permitted, nil
}
