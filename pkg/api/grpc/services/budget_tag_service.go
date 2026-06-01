package services

import (
	"context"

	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	svcfilter "github.com/pixlcrashr/vsfv/pkg/api/grpc/services/filter"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services/pagetoken"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type budgetTagServiceServer struct {
	gen.UnimplementedBudgetTagServiceServer
	repo *repository.BudgetTagRepository
}

func newBudgetTagServiceServer(repo *repository.BudgetTagRepository) gen.BudgetTagServiceServer {
	return &budgetTagServiceServer{repo: repo}
}

func (s *budgetTagServiceServer) GetBudgetTag(ctx context.Context, req *gen.GetBudgetTagRequest) (*gen.BudgetTag, error) {
	tagID, err := lastSegment(req.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget tag name")
	}
	m, err := s.repo.GetByID(ctx, tagID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget tag not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget tag")
	}
	return BudgetTagToProto(m), nil
}

func (s *budgetTagServiceServer) ListBudgetTags(ctx context.Context, req *gen.ListBudgetTagsRequest) (*gen.ListBudgetTagsResponse, error) {
	budgetID, err := idFromName(req.Parent, "budgets/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}

	c, err := svcfilter.ParseBudgetTagFilter(req.Filter)
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

	params := repository.ListBudgetTagsParams{
		BudgetID: budgetID,
		Page:     int(offset/int64(pageSize)) + 1,
		PageSize: pageSize,
		Cond:     c,
	}

	ms, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to list budget tags")
	}

	resp := &gen.ListBudgetTagsResponse{TotalSize: total}
	for _, m := range ms {
		resp.Tags = append(resp.Tags, BudgetTagToProto(m))
	}
	nextOffset := offset + int64(len(ms))
	if nextOffset < total {
		resp.NextPageToken = pagetoken.Encode(nextOffset)
	}
	return resp, nil
}

func (s *budgetTagServiceServer) CreateBudgetTag(ctx context.Context, req *gen.CreateBudgetTagRequest) (*gen.BudgetTag, error) {
	budgetID, err := idFromName(req.Parent, "budgets/")
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid parent budget name")
	}
	if req.Tag == nil {
		return nil, status.Error(codes.InvalidArgument, "tag is required")
	}
	m := &model.BudgetTag{
		BudgetID:           budgetID,
		DisplayDescription: req.Tag.DisplayDescription,
	}
	if req.Tag.Date != nil {
		m.Date = protoDateToTime(req.Tag.Date)
	}
	if err := s.repo.Create(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to create budget tag")
	}
	return BudgetTagToProto(m), nil
}

func (s *budgetTagServiceServer) UpdateBudgetTag(ctx context.Context, req *gen.UpdateBudgetTagRequest) (*gen.BudgetTag, error) {
	if req.Tag == nil {
		return nil, status.Error(codes.InvalidArgument, "tag is required")
	}
	tagID, err := lastSegment(req.Tag.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget tag name")
	}
	m, err := s.repo.GetByID(ctx, tagID)
	if err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget tag not found")
		}
		return nil, status.Error(codes.Internal, "failed to get budget tag")
	}
	m.DisplayDescription = req.Tag.DisplayDescription
	if req.Tag.Date != nil {
		m.Date = protoDateToTime(req.Tag.Date)
	}
	if err := s.repo.Update(ctx, m); err != nil {
		return nil, status.Error(codes.Internal, "failed to update budget tag")
	}
	return BudgetTagToProto(m), nil
}

func (s *budgetTagServiceServer) DeleteBudgetTag(ctx context.Context, req *gen.DeleteBudgetTagRequest) (*emptypb.Empty, error) {
	tagID, err := lastSegment(req.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid budget tag name")
	}
	if err := s.repo.Delete(ctx, tagID); err != nil {
		if isNotFound(err) {
			return nil, status.Error(codes.NotFound, "budget tag not found")
		}
		return nil, status.Error(codes.Internal, "failed to delete budget tag")
	}
	return &emptypb.Empty{}, nil
}
