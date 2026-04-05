package budgets

import (
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/api/types"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
)

// Budget is the API representation of a budget.
type Budget struct {
	ID                 uuid.UUID  `json:"id" doc:"Budget UUID"`
	DisplayName        string     `json:"displayName" doc:"Human-readable budget name"`
	DisplayDescription string     `json:"displayDescription" doc:"Optional free-text description"`
	IsClosed           bool       `json:"isClosed" doc:"Whether the budget is closed"`
	PeriodStart        types.Date `json:"periodStart" doc:"Budget period start date"`
	PeriodEnd          types.Date `json:"periodEnd" doc:"Budget period end date"`
	UpdatedAt          time.Time  `json:"updateTime" doc:"Last modification timestamp"`
	CreatedAt          time.Time  `json:"createTime" doc:"Creation timestamp"`
}

func (b *Budget) fromModel(m *model.Budget) {
	b.ID = m.ID
	b.DisplayName = m.DisplayName
	b.DisplayDescription = m.DisplayDescription
	b.IsClosed = m.IsClosed
	b.PeriodStart = types.NewDate(m.PeriodStart)
	b.PeriodEnd = types.NewDate(m.PeriodEnd)
	b.UpdatedAt = m.UpdatedAt
	b.CreatedAt = m.CreatedAt
}

// --- GetBudget

type GetBudgetRequest struct {
	BudgetID uuid.UUID `path:"budgetId" doc:"Budget UUID"`
}

type GetBudgetResponse struct {
	Body Budget
}

// --- ListBudgets

type ListBudgetsRequest struct {
	PageSize      int    `query:"pageSize" doc:"Budgets per page (max 100)" minimum:"1" maximum:"100" default:"20"`
	Page          int    `query:"page" doc:"Page number (1-indexed)" minimum:"1" default:"1"`
	DisplayName   string `query:"displayName" doc:"Filter by display name prefix" maxLength:"200"`
	IncludeClosed bool   `query:"showDeleted" doc:"Include closed budgets (default false)"`
	OrderBy       string `query:"orderBy" doc:"Order by field (e.g. 'displayName', 'periodStart desc')" maxLength:"100"`
}

type ListBudgetsResponse struct {
	Body struct {
		Budgets []Budget `json:"budgets"`
		Total   int64    `json:"total" doc:"Total number of budgets matching the filter"`
	}
}

// --- CreateBudget

type CreateBudgetRequest struct {
	Body struct {
		DisplayName        string                 `json:"displayName" doc:"Human-readable budget name" maxLength:"200"`
		DisplayDescription types.Optional[string] `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
		PeriodStart        types.Date             `json:"periodStart" doc:"Budget period start date"`
		PeriodEnd          types.Date             `json:"periodEnd" doc:"Budget period end date"`
	}
}

type CreateBudgetResponse struct {
	Body Budget
}

// --- UpdateBudget

type UpdateBudgetRequest struct {
	BudgetID uuid.UUID `path:"budgetId" doc:"Budget UUID"`
	Body     struct {
		DisplayName        types.Optional[string]     `json:"displayName,omitempty" doc:"Human-readable budget name" maxLength:"200"`
		DisplayDescription types.Optional[string]     `json:"displayDescription,omitempty" doc:"Optional free-text description" maxLength:"1000"`
		PeriodStart        types.Optional[types.Date] `json:"periodStart,omitempty" doc:"Budget period start date"`
		PeriodEnd          types.Optional[types.Date] `json:"periodEnd,omitempty" doc:"Budget period end date"`
	}
}

type UpdateBudgetResponse struct {
	Body Budget
}

// --- CloseBudget

type CloseBudgetRequest struct {
	BudgetID uuid.UUID `path:"budgetId" doc:"Budget UUID"`
}

type CloseBudgetResponse struct {
	Body Budget
}

// --- DeleteBudget

type DeleteBudgetRequest struct {
	BudgetID uuid.UUID `path:"budgetId" doc:"Budget UUID"`
}

type DeleteBudgetResponse struct{}
