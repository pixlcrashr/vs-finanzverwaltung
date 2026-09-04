package xmlformat

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestMarshalUnmarshalRoundtrip(t *testing.T) {
	doc := &Document{
		Version:    Version,
		ExportedAt: "2026-09-02T12:00:00Z",
		Accounts: []Account{
			{
				ID:          "11111111-1111-1111-1111-111111111111",
				DisplayName: "Root",
				Children: []Account{
					{
						ID:              "22222222-2222-2222-2222-222222222222",
						ParentAccountID: "11111111-1111-1111-1111-111111111111",
						DisplayName:     "Child",
					},
				},
			},
		},
		AccountGroups: []AccountGroup{
			{
				ID:          "33333333-3333-3333-3333-333333333333",
				DisplayName: "Group",
				Assignments: []AccountGroupAssignment{
					{AccountID: "22222222-2222-2222-2222-222222222222", Negate: true},
				},
			},
		},
		LedgerAccounts: []LedgerAccount{
			{
				ID:          "44444444-4444-4444-4444-444444444444",
				Code:        "1000",
				AccountType: "asset",
				DisplayName: "Bank",
			},
		},
		LedgerYears: []LedgerYear{
			{ID: "55555555-5555-5555-5555-555555555555", Year: 2026, IsClosed: false},
		},
		Budgets: []Budget{
			{
				ID:          "66666666-6666-6666-6666-666666666666",
				DisplayName: "Budget",
				PeriodStart: "2026-01-01",
				PeriodEnd:   "2026-12-31",
				AccountValues: []BudgetValue{
					{AccountID: "22222222-2222-2222-2222-222222222222", Value: "1500.00"},
				},
				Revisions: []BudgetRevision{
					{
						ID:   "77777777-7777-7777-7777-777777777777",
						Date: "2026-03-15",
						AccountValues: []BudgetValue{
							{AccountID: "22222222-2222-2222-2222-222222222222", Value: "200.00"},
						},
					},
				},
			},
		},
		Transactions: []Transaction{
			{
				ID:                    "88888888-8888-8888-8888-888888888888",
				CreditLedgerAccountID: "44444444-4444-4444-4444-444444444444",
				DebitLedgerAccountID:  "44444444-4444-4444-4444-444444444444",
				Amount:                "120.50",
				BookedAt:              "2026-01-15",
				DocumentDate:          "2026-01-15",
				Assignments: []TransactionAssignment{
					{AccountID: "22222222-2222-2222-2222-222222222222", Value: "120.50"},
				},
			},
		},
	}

	data, err := Marshal(doc)
	require.NoError(t, err)
	require.Contains(t, string(data), `<vsfvExport version="1" exportedAt="2026-09-02T12:00:00Z">`)

	got, err := Unmarshal(data)
	require.NoError(t, err)
	require.Equal(t, Version, got.Version)
	require.Equal(t, doc.ExportedAt, got.ExportedAt)
	require.Len(t, got.Accounts, 1)
	require.Len(t, got.Accounts[0].Children, 1)
	require.Len(t, got.AccountGroups, 1)
	require.Len(t, got.AccountGroups[0].Assignments, 1)
	require.True(t, got.AccountGroups[0].Assignments[0].Negate)
	require.Len(t, got.LedgerAccounts, 1)
	require.Equal(t, "asset", got.LedgerAccounts[0].AccountType)
	require.Len(t, got.Budgets, 1)
	require.Len(t, got.Budgets[0].Revisions, 1)
	require.Len(t, got.Transactions, 1)
	require.Len(t, got.Transactions[0].Assignments, 1)
}
