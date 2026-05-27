package accounts

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
	ErrAccountNotFound      = huma.Error404NotFound("account not found")
	ErrFailedToList         = huma.Error500InternalServerError("failed to list accounts")
	ErrFailedToCreate       = huma.Error500InternalServerError("failed to create account")
	ErrFailedToUpdate       = huma.Error500InternalServerError("failed to update account")
	ErrFailedToDelete       = huma.Error500InternalServerError("failed to delete account")
	ErrFailedToGetHierarchy = huma.Error500InternalServerError("failed to get account hierarchy")
	ErrParentAccountCycle   = huma.Error400BadRequest("cannot set parent account: would create a cycle")
	ErrParentNotFound       = huma.Error400BadRequest("parent account not found")
	ErrInvalidOrderBy       = huma.Error400BadRequest("invalid orderBy format")
)

type Handler struct {
	repo *repository.AccountRepository
}

func NewHandler(repo *repository.AccountRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) GetAccount(ctx context.Context, req *GetAccountRequest) (*GetAccountResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	a := Account{}
	a.fromModel(m)

	return &GetAccountResponse{Body: a}, nil
}

func (h *Handler) ListAccounts(ctx context.Context, req *ListAccountsRequest) (*ListAccountsResponse, error) {
	var orderByFields order.Fields
	if req.OrderBy != "" {
		if err := orderByFields.UnmarshalString(req.OrderBy); err != nil {
			return nil, ErrInvalidOrderBy
		}
	}

	ms, total, err := h.repo.List(ctx, repository.ListAccountsParams{
		NamePrefix:      req.DisplayName,
		IncludeArchived: req.IncludeArchived,
		Page:            req.Page,
		PageSize:        req.PageSize,
		OrderBy:         orderByFields,
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListAccountsResponse{}
	resp.Body.Accounts = lo.Map(ms, func(m *model.Account, _ int) Account {
		a := Account{}
		a.fromModel(m)
		return a
	})
	resp.Body.Total = total

	return resp, nil
}

func (h *Handler) CreateAccount(ctx context.Context, req *CreateAccountRequest) (*CreateAccountResponse, error) {
	now := time.Now()
	m := &model.Account{
		ID:          uuid.New(),
		DisplayName: req.Body.DisplayName,
		DisplayCode: req.Body.DisplayCode,
		IsContainer: req.Body.IsContainer,
		IsArchived:  false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if req.Body.ParentAccountID.IsSet {
		// Verify parent exists
		_, err := h.repo.GetByID(ctx, req.Body.ParentAccountID.Value)
		if err != nil {
			return nil, ErrParentNotFound
		}
		m.ParentAccountID = uuid.NullUUID{UUID: req.Body.ParentAccountID.Value, Valid: true}
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	a := Account{}
	a.fromModel(m)

	return &CreateAccountResponse{Body: a}, nil
}

func (h *Handler) UpdateAccount(ctx context.Context, req *UpdateAccountRequest) (*UpdateAccountResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	// Check for cycle if parent is changing
	if req.Body.ParentAccountID.IsSet {
		// Verify parent exists
		_, err := h.repo.GetByID(ctx, req.Body.ParentAccountID.Value)
		if err != nil {
			return nil, ErrParentNotFound
		}

		// Check for cycle
		hasCycle, err := h.repo.HasAncestor(ctx, req.Body.ParentAccountID.Value, req.AccountID)
		if err != nil {
			return nil, ErrFailedToUpdate
		}
		if hasCycle {
			return nil, ErrParentAccountCycle
		}
		m.ParentAccountID = uuid.NullUUID{UUID: req.Body.ParentAccountID.Value, Valid: true}
	}

	if req.Body.DisplayName.IsSet {
		m.DisplayName = req.Body.DisplayName.Value
	}

	if req.Body.DisplayDescription.IsSet {
		m.DisplayDescription = req.Body.DisplayDescription.Value
	}

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	a := Account{}
	a.fromModel(m)

	return &UpdateAccountResponse{Body: a}, nil
}

func (h *Handler) ArchiveAccount(ctx context.Context, req *ArchiveAccountRequest) (*ArchiveAccountResponse, error) {
	m, err := h.repo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	m.IsArchived = true
	m.UpdatedAt = time.Now()

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	a := Account{}
	a.fromModel(m)

	return &ArchiveAccountResponse{Body: a}, nil
}

func (h *Handler) DeleteAccount(ctx context.Context, req *DeleteAccountRequest) (*DeleteAccountResponse, error) {
	// Verify account exists
	_, err := h.repo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	if err := h.repo.Delete(ctx, req.AccountID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteAccountResponse{}, nil
}

func (h *Handler) ListNestedAccount(ctx context.Context, req *ListNestedAccountRequest) (*ListNestedAccountResponse, error) {
	ms, err := h.repo.ListNested(ctx, repository.ListNestedParams{
		IsArchived: req.IsArchived,
	})
	if err != nil {
		return nil, ErrFailedToGetHierarchy
	}

	// Build a map for quick lookup
	accountMap := make(map[uuid.UUID]*NestedAccount)
	for _, m := range ms {
		h := &NestedAccount{}
		h.fromModel(m)
		accountMap[m.ID] = h
	}

	// Build the hierarchy
	var roots []*NestedAccount
	for _, m := range ms {
		h := accountMap[m.ID]

		if m.ParentAccountID.Valid {
			if parent, ok := accountMap[m.ParentAccountID.UUID]; ok {
				parent.Children = append(parent.Children, h)
			}
		} else {
			roots = append(roots, h)
		}
	}

	return &ListNestedAccountResponse{Body: struct {
		Accounts []*NestedAccount `json:"accounts" doc:"Root-level accounts with their children"`
	}{Accounts: roots}}, nil
}

func (h *Handler) GetNestedAccount(ctx context.Context, req *GetNestedAccountRequest) (*GetNestedAccountResponse, error) {
	// Verify the account exists
	_, err := h.repo.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	// Get the subtree starting from this account
	ms, err := h.repo.GetSubtree(ctx, req.AccountID, req.IsArchived)
	if err != nil {
		return nil, ErrFailedToGetHierarchy
	}

	// Build a map for quick lookup
	accountMap := make(map[uuid.UUID]*NestedAccount)
	for _, m := range ms {
		n := &NestedAccount{}
		n.fromModel(m)
		accountMap[m.ID] = n
	}

	// Build the hierarchy
	var root *NestedAccount
	for _, m := range ms {
		n := accountMap[m.ID]
		if m.ID == req.AccountID {
			root = n
		} else if m.ParentAccountID.Valid {
			if parent, ok := accountMap[m.ParentAccountID.UUID]; ok {
				parent.Children = append(parent.Children, n)
			}
		}
	}

	if root == nil {
		return nil, ErrAccountNotFound
	}

	return &GetNestedAccountResponse{Body: root}, nil
}
