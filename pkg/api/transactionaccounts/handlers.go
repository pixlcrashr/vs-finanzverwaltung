package transactionaccounts

import (
	"context"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/samber/lo"
)

var (
	ErrTransactionAccountNotFound = huma.Error404NotFound("transaction account not found")
	ErrFailedToList               = huma.Error500InternalServerError("failed to list transaction accounts")
	ErrFailedToCreate             = huma.Error500InternalServerError("failed to create transaction account")
	ErrFailedToUpdate             = huma.Error500InternalServerError("failed to update transaction account")
	ErrFailedToDelete             = huma.Error500InternalServerError("failed to delete transaction account")
	ErrInvalidOrderBy             = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.TransactionAccountRepository
}

func NewHandler(repo *repository.TransactionAccountRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetTransactionAccount(ctx context.Context, req *GetTransactionAccountRequest) (*GetTransactionAccountResponse, error) {
	m, err := h.repo.GetByID(ctx, req.TransactionAccountID)
	if err != nil {
		return nil, ErrTransactionAccountNotFound
	}

	ta := TransactionAccount{}
	ta.fromModel(m)

	return &GetTransactionAccountResponse{Body: ta}, nil
}

func (h *Handler) ListTransactionAccounts(ctx context.Context, req *ListTransactionAccountsRequest) (*ListTransactionAccountsResponse, error) {
	var importSourceID *uuid.UUID
	if req.ImportSourceID.IsSet {
		importSourceID = &req.ImportSourceID.Value
	}

	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListTransactionAccountsParams{
		ImportSourceID: importSourceID,
		CodePrefix:     req.Code,
		Page:           req.Page,
		PageSize:       req.PageSize,
		OrderBy:        orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListTransactionAccountsResponse{}
	resp.Body.TransactionAccounts = lo.Map(ms, func(m *model.TransactionAccount, _ int) TransactionAccount {
		ta := TransactionAccount{}
		ta.fromModel(m)
		return ta
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateTransactionAccount(ctx context.Context, req *CreateTransactionAccountRequest) (*CreateTransactionAccountResponse, error) {
	now := time.Now()
	m := &model.TransactionAccount{
		ID:             uuid.New(),
		Code:           req.Body.Code,
		ImportSourceID: req.Body.ImportSourceID,
		CreatedAt:      now,
		UpdatedAt:      now,
	}
	if req.Body.DisplayName.IsSet {
		m.DisplayName = req.Body.DisplayName.Value
	}
	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	ta := TransactionAccount{}
	ta.fromModel(m)

	return &CreateTransactionAccountResponse{Body: ta}, nil
}

func (h *Handler) UpdateTransactionAccount(ctx context.Context, req *UpdateTransactionAccountRequest) (*UpdateTransactionAccountResponse, error) {
	m, err := h.repo.GetByID(ctx, req.TransactionAccountID)
	if err != nil {
		return nil, ErrTransactionAccountNotFound
	}

	if req.Body.DisplayName.IsSet {
		m.DisplayName = req.Body.DisplayName.Value
	}
	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	ta := TransactionAccount{}
	ta.fromModel(m)

	return &UpdateTransactionAccountResponse{Body: ta}, nil
}

func (h *Handler) DeleteTransactionAccount(ctx context.Context, req *DeleteTransactionAccountRequest) (*DeleteTransactionAccountResponse, error) {
	_, err := h.repo.GetByID(ctx, req.TransactionAccountID)
	if err != nil {
		return nil, ErrTransactionAccountNotFound
	}

	if err := h.repo.Delete(ctx, req.TransactionAccountID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteTransactionAccountResponse{}, nil
}
