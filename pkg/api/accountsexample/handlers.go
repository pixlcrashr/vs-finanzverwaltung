package accountsexample

import (
	"context"
	"fmt"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/pixlcrashr/go-pagetoken"
	"github.com/pixlcrashr/go-pagetoken/encryption"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/samber/lo"
	"go.einride.tech/aip/ordering"
)

var ErrAccountNotFound = huma.Error404NotFound("account not found")

type Handler struct {
	r *repository.AccountRepository
	e *encryption.AEADEncryptor
}

func (h *Handler) GetAccount(ctx context.Context, req *GetAccountRequest) (*GetAccountResponse, error) {
	m, err := h.r.GetByID(ctx, req.AccountID)
	if err != nil {
		return nil, ErrAccountNotFound
	}

	a := Account{}
	a.fromModel(m)

	return &GetAccountResponse{Body: a}, nil
}

func parseOrder(s string) (ordering.OrderBy, error) {
	order := ordering.OrderBy{}
	if err := order.UnmarshalString(s); err != nil {
		return ordering.OrderBy{}, fmt.Errorf("parsing order_by: %v", err)
	}
	if err := order.ValidateForPaths("id", "display_name", "display_code", "created_at", "updated_at"); err != nil {
		return ordering.OrderBy{}, fmt.Errorf("validating order_by: %v", err)
	}

	return order, nil
}

var ErrInvalidAccountOrder = huma.Error400BadRequest("invalid order_by")
var ErrInvalidAccountPageToken = huma.Error400BadRequest("invalid page_token")
var ErrFailedToListAccounts = huma.Error500InternalServerError("failed to list accounts")

func (h *Handler) ListAccounts(ctx context.Context, req *ListAccountsRequest) (*ListAccountsResponse, error) {
	/*order, err := parseOrder(req.OrderBy)
	if err != nil {
		return nil, ErrInvalidAccountOrder
	}*/

	t, err := pagetoken.KeysetTokenFromRequest(h.e, req)
	if err != nil {
		return nil, ErrInvalidAccountPageToken
	}

	ms, err := h.r.List(ctx, repository.ListAccountsOpts{
		NamePrefix:      req.Name,
		IncludeArchived: req.IncludeArchived,
		Limit:           req.PageSize + 1,
		KeysetFields:    t.Fields(),
	})
	if err != nil {
		return nil, ErrFailedToListAccounts
	}

	resp := &ListAccountsResponse{}

	l := len(ms)
	// add page token if there is a next page
	if l > req.PageSize {
		t2 := t.Next(
			pagetoken.WithKeysetField("created_at", ms[req.PageSize].CreatedAt.Format(time.RFC3339Nano), pagetoken.OrderDesc),
		)
		s, err := t2.String()
		if err != nil {
			return nil, ErrInvalidAccountPageToken
		}
		resp.Body.NextPageToken = s
		l = req.PageSize
	}

	resp.Body.Accounts = lo.Map(ms[:l], func(m *model.Account, _ int) Account {
		a := Account{}
		a.fromModel(m)
		return a
	})

	return resp, nil
}
