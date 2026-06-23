package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model/dao"
	"gorm.io/gorm"
)

var (
	ErrBudgetActualAccountValueNotFound = errors.New("budget actual account value not found")
)

// ActualAccountValue is a computed (non-persisted) result representing the
// actual monetary value for a single budget account within a budget period.
type ActualAccountValue struct {
	AccountID       uuid.UUID
	AccountCustomID string
	Value           apd.Decimal
}

// budgetActualRow is the raw SQL scan target for the actual-value query.
type budgetActualRow struct {
	AccountID       uuid.UUID   `gorm:"column:account_id"`
	AccountCustomID string      `gorm:"column:account_custom_id"`
	Amount          apd.Decimal `gorm:"column:amount"`
}

// BudgetActualAccountValueRepository computes actual account values from
// transaction assignments whose parent transactions fall within a
// budget's period.
type BudgetActualAccountValueRepository struct {
	db *gorm.DB
	q  *dao.Query
}

// NewBudgetActualAccountValueRepository creates a new repository backed by db.
func NewBudgetActualAccountValueRepository(db *gorm.DB) *BudgetActualAccountValueRepository {
	return &BudgetActualAccountValueRepository{db: db, q: dao.Use(db)}
}

// ListByBudget computes the actual values for every account that has
// assignments within the given budget's period.
//
// The calculation uses the credit-side ledger account type to determine the sign:
//   - Credit to ASSET (1) or EXPENSE (5): negative value (outflow/expense reduction)
//   - Credit to LIABILITY (2), EQUITY (3), or REVENUE (4): positive value (inflow)
//
// This implements standard double-entry booking logic where the credit side
// determines the accounting effect on budget accounts.
func (r *BudgetActualAccountValueRepository) ListByBudget(
	ctx context.Context,
	organizationID uuid.UUID,
	periodStart,
	periodEnd time.Time,
) ([]*ActualAccountValue, error) {
	query := `
SELECT
    taa.account_id,
    a.custom_id AS account_custom_id,
    SUM(
        CASE
            WHEN la.account_type IN (1, 5) THEN -taa.value
            ELSE taa.value
        END
    ) AS amount
FROM transaction_assignments taa
JOIN transactions t ON t.id = taa.transaction_id
JOIN ledger_accounts la ON la.id = t.credit_ledger_account_id
JOIN accounts a ON a.id = taa.account_id
WHERE t.organization_id = ?
  AND t.document_date >= ?
  AND t.document_date <= ?
GROUP BY taa.account_id, a.custom_id
ORDER BY taa.account_id
`

	var rows []budgetActualRow
	if err := r.db.WithContext(ctx).Raw(query,
		organizationID, periodStart, periodEnd,
	).Scan(&rows).Error; err != nil {
		return nil, fmt.Errorf("list budget actual account values: %w", err)
	}

	result := make([]*ActualAccountValue, 0, len(rows))
	for _, row := range rows {
		v := &ActualAccountValue{
			AccountID:       row.AccountID,
			AccountCustomID: row.AccountCustomID,
		}
		v.Value.Set(&row.Amount)
		result = append(result, v)
	}

	return result, nil
}

// GetByBudgetAndAccount computes the actual value for a single account within
// a budget period.
//
// Uses the same credit-side ledger account type logic as ListByBudget.
func (r *BudgetActualAccountValueRepository) GetByBudgetAndAccount(
	ctx context.Context,
	organizationID uuid.UUID,
	periodStart, periodEnd time.Time,
	accountCustomID string,
) (*ActualAccountValue, error) {
	query := `
SELECT
    taa.account_id,
    a.custom_id AS account_custom_id,
    SUM(
        CASE
            WHEN la.account_type IN (1, 5) THEN -taa.value
            ELSE taa.value
        END
    ) AS amount
FROM transaction_assignments taa
JOIN transactions t ON t.id = taa.transaction_id
JOIN ledger_accounts la ON la.id = t.credit_ledger_account_id
JOIN accounts a ON a.id = taa.account_id
WHERE t.organization_id = ?
  AND t.document_date >= ?
  AND t.document_date <= ?
  AND a.custom_id = ?
GROUP BY taa.account_id, a.custom_id
`

	var row budgetActualRow
	if err := r.db.WithContext(ctx).Raw(query,
		organizationID, periodStart, periodEnd, accountCustomID,
	).Scan(&row).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrBudgetActualAccountValueNotFound
		}
		return nil, fmt.Errorf("get budget actual account value: %w", err)
	}

	// Check if we got a valid result (amount will be NULL if no rows)
	if row.AccountID == uuid.Nil {
		return nil, ErrBudgetActualAccountValueNotFound
	}

	return &ActualAccountValue{
		AccountID:       row.AccountID,
		AccountCustomID: row.AccountCustomID,
		Value:           row.Amount,
	}, nil
}
