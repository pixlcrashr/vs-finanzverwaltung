package transactions

import (
	"context"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"github.com/pixlcrashr/go-pagetoken"
	"github.com/pixlcrashr/go-pagetoken/encryption"
	"github.com/pixlcrashr/go-pagetoken/order"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/samber/lo"
)

var (
	ErrTransactionNotFound = huma.Error404NotFound("transaction not found")
	ErrInvalidPageToken    = huma.Error400BadRequest("invalid page token")
	ErrInvalidAmount       = huma.Error400BadRequest("invalid amount format")
	ErrFailedToList        = huma.Error500InternalServerError("failed to list transactions")
	ErrFailedToCreate      = huma.Error500InternalServerError("failed to create transaction")
	ErrFailedToUpdate      = huma.Error500InternalServerError("failed to update transaction")
	ErrFailedToDelete      = huma.Error500InternalServerError("failed to delete transaction")
)

type Handler struct {
	repo      *repository.TransactionRepository
	encryptor encryption.Crypter
}

func NewHandler(repo *repository.TransactionRepository, encryptor encryption.Crypter) *Handler {
	return &Handler{repo: repo, encryptor: encryptor}
}

func (h *Handler) GetTransaction(ctx context.Context, req *GetTransactionRequest) (*GetTransactionResponse, error) {
	m, err := h.repo.GetByID(ctx, req.TransactionID)
	if err != nil {
		return nil, ErrTransactionNotFound
	}

	t := Transaction{}
	t.fromModel(m)

	return &GetTransactionResponse{Body: t}, nil
}

func (h *Handler) ListTransactions(ctx context.Context, req *ListTransactionsRequest) (*ListTransactionsResponse, error) {
	// Resolve optional filter parameters
	var creditAccountID, debitAccountID *uuid.UUID
	var bookedAtStart, bookedAtEnd *time.Time

	if req.CreditTransactionAccID.IsSet {
		creditAccountID = &req.CreditTransactionAccID.Value
	}
	if req.DebitTransactionAccID.IsSet {
		debitAccountID = &req.DebitTransactionAccID.Value
	}
	if req.BookedAtStart.IsSet {
		bookedAtStart = &req.BookedAtStart.Value
	}
	if req.BookedAtEnd.IsSet {
		bookedAtEnd = &req.BookedAtEnd.Value
	}

	// Parse page token using the library
	rr := pagetoken.NewRequestReader(pagetoken.WithEncryptor(h.encryptor))
	cursor, err := rr.Read(req)
	if err != nil {
		return nil, ErrInvalidPageToken
	}

	ms, err := h.repo.List(ctx, repository.ListTransactionsParams{
		CreditAccountID: creditAccountID,
		DebitAccountID:  debitAccountID,
		BookedAtStart:   bookedAtStart,
		BookedAtEnd:     bookedAtEnd,
		KeysetValues:    cursor.Payload().Values(),
		PageSize:        req.PageSize + 1, // Fetch one extra to determine if there's a next page
	})
	if err != nil {
		return nil, ErrFailedToList
	}

	resp := &ListTransactionsResponse{}

	l := len(ms)
	hasNextPage := l > req.PageSize
	if hasNextPage {
		l = req.PageSize
	}

	resp.Body.Transactions = lo.Map(ms[:l], func(m *model.Transaction_, _ int) Transaction {
		t := Transaction{}
		t.fromModel(m)
		return t
	})

	// Generate next page token if there are more results
	if hasNextPage && l > 0 {
		lastItem := ms[l-1]
		// Build next cursor with the values from the last item
		nextPayload := pagetoken.NewKeysetPayloadBuilder().
			AddTime("booked_at", lastItem.BookedAt, order.Desc).
			AddString("id", lastItem.ID.String(), order.Desc).
			Build()

		nextCursor := cursor.Next(pagetoken.WithKeysetPayload(nextPayload))
		token, err := nextCursor.String()
		if err != nil {
			return nil, ErrInvalidPageToken
		}
		resp.Body.NextPageToken = token
	}

	return resp, nil
}

func (h *Handler) CreateTransaction(ctx context.Context, req *CreateTransactionRequest) (*CreateTransactionResponse, error) {
	amount, err := parseDecimal(req.Body.Amount)
	if err != nil {
		return nil, ErrInvalidAmount
	}

	now := time.Now()
	m := &model.Transaction_{
		ID:                         uuid.New(),
		CreditTransactionAccountID: req.Body.CreditTransactionAccountID,
		DebitTransactionAccountID:  req.Body.DebitTransactionAccountID,
		Amount:                     amount,
		BookedAt:                   req.Body.BookedAt,
		DocumentDate:               req.Body.DocumentDate,
		CreatedAt:                  now,
		UpdatedAt:                  now,
	}
	if req.Body.Description.IsSet {
		m.Description = req.Body.Description.Value
	}
	if req.Body.Reference.IsSet {
		m.Reference = req.Body.Reference.Value
	}
	if req.Body.AssignedAccountID.IsSet {
		m.AssignedAccountID = uuid.NullUUID{UUID: req.Body.AssignedAccountID.Value, Valid: true}
	}

	if err := h.repo.Create(ctx, m); err != nil {
		return nil, ErrFailedToCreate
	}

	t := Transaction{}
	t.fromModel(m)

	return &CreateTransactionResponse{Body: t}, nil
}

func (h *Handler) UpdateTransaction(ctx context.Context, req *UpdateTransactionRequest) (*UpdateTransactionResponse, error) {
	m, err := h.repo.GetByID(ctx, req.TransactionID)
	if err != nil {
		return nil, ErrTransactionNotFound
	}

	m.UpdatedAt = time.Now()

	if req.Body.Description.IsSet {
		m.Description = req.Body.Description.Value
	}
	if req.Body.Reference.IsSet {
		m.Reference = req.Body.Reference.Value
	}
	if req.Body.AssignedAccountID.IsSet {
		m.AssignedAccountID = uuid.NullUUID{UUID: req.Body.AssignedAccountID.Value, Valid: true}
	}

	if err := h.repo.Update(ctx, m); err != nil {
		return nil, ErrFailedToUpdate
	}

	t := Transaction{}
	t.fromModel(m)

	return &UpdateTransactionResponse{Body: t}, nil
}

func (h *Handler) DeleteTransaction(ctx context.Context, req *DeleteTransactionRequest) (*DeleteTransactionResponse, error) {
	// Verify transaction exists
	_, err := h.repo.GetByID(ctx, req.TransactionID)
	if err != nil {
		return nil, ErrTransactionNotFound
	}

	if err := h.repo.Delete(ctx, req.TransactionID); err != nil {
		return nil, ErrFailedToDelete
	}

	return &DeleteTransactionResponse{}, nil
}
