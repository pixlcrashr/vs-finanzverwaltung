package xmlformat

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/pixlcrashr/vsfv/pkg/db"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
)

func setupTestDB(t *testing.T) *gorm.DB {
	dbConn, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(dbConn))
	return dbConn
}

func TestImportExportRoundtrip(t *testing.T) {
	dbConn := setupTestDB(t)
	ctx := t.Context()

	orgID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	require.NoError(t, dbConn.Create(&model.Organization{
		ID:          orgID,
		DisplayName: "Test",
	}).Error)

	doc := &Document{
		Version: Version,
		Accounts: []Account{
			{
				ID:          "10000000-0000-0000-0000-000000000001",
				DisplayName: "Root",
				Children: []Account{
					{
						ID:              "10000000-0000-0000-0000-000000000002",
						ParentAccountID: "10000000-0000-0000-0000-000000000001",
						DisplayName:     "Child",
					},
				},
			},
		},
		LedgerAccounts: []LedgerAccount{
			{
				ID:          "20000000-0000-0000-0000-000000000001",
				Code:        "1000",
				AccountType: "asset",
				DisplayName: "Bank",
			},
		},
		Budgets: []Budget{
			{
				ID:          "30000000-0000-0000-0000-000000000001",
				DisplayName: "Budget 2026",
				PeriodStart: "2026-01-01",
				PeriodEnd:   "2026-12-31",
				AccountValues: []BudgetValue{
					{AccountID: "10000000-0000-0000-0000-000000000002", Value: "1000.00"},
				},
				Revisions: []BudgetRevision{
					{
						ID:   "31000000-0000-0000-0000-000000000001",
						Date: "2026-03-01",
						AccountValues: []BudgetValue{
							{AccountID: "10000000-0000-0000-0000-000000000002", Value: "200.00"},
						},
					},
				},
			},
		},
		Transactions: []Transaction{
			{
				ID:                    "40000000-0000-0000-0000-000000000001",
				CreditLedgerAccountID: "20000000-0000-0000-0000-000000000001",
				DebitLedgerAccountID:  "20000000-0000-0000-0000-000000000001",
				Amount:                "50.00",
				BookedAt:              "2026-01-15",
				DocumentDate:          "2026-01-15",
				Assignments: []TransactionAssignment{
					{AccountID: "10000000-0000-0000-0000-000000000002", Value: "50.00"},
				},
			},
		},
	}

	require.NoError(t, ImportDocument(ctx, dbConn, orgID, doc))

	deps := &ExportRepositoryDependencies{
		AccountRepo:                    repository.NewAccountRepository(dbConn),
		AccountGroupRepo:               repository.NewAccountGroupRepository(dbConn),
		AccountGroupAssignmentRepo:     repository.NewAccountGroupAssignmentRepository(dbConn),
		BudgetRepo:                     repository.NewBudgetRepository(dbConn),
		BudgetAccountValueRepo:         repository.NewBudgetAccountValueRepository(dbConn),
		BudgetRevisionRepo:             repository.NewBudgetRevisionRepository(dbConn),
		BudgetRevisionAccountValueRepo: repository.NewBudgetRevisionAccountValueRepository(dbConn),
		LedgerAccountRepo:              repository.NewLedgerAccountRepository(dbConn),
		LedgerYearRepo:                 repository.NewLedgerYearRepository(dbConn),
		TransactionRepo:                repository.NewTransactionRepository(dbConn),
		TransactionAssignmentRepo:      repository.NewTransactionAssignmentRepository(dbConn),
	}
	exported, err := ExportOrganization(ctx, deps, orgID)
	require.NoError(t, err)

	require.Len(t, exported.Accounts, 1)
	require.Len(t, exported.Accounts[0].Children, 1)
	require.Len(t, exported.LedgerAccounts, 1)
	require.Len(t, exported.Budgets, 1)
	require.Len(t, exported.Budgets[0].AccountValues, 1)
	require.Len(t, exported.Budgets[0].Revisions, 1)
	require.Len(t, exported.Transactions, 1)
	require.Len(t, exported.Transactions[0].Assignments, 1)
}

func TestImportUnsupportedVersion(t *testing.T) {
	dbConn := setupTestDB(t)
	doc := &Document{Version: 99}
	err := ImportDocument(t.Context(), dbConn, uuid.New(), doc)
	require.Error(t, err)
	require.Contains(t, err.Error(), "unsupported format version")
}

func TestImportAutoCreatesMissingLedgerAccount(t *testing.T) {
	dbConn := setupTestDB(t)
	ctx := t.Context()

	orgID := uuid.MustParse("00000000-0000-0000-0000-000000000002")
	require.NoError(t, dbConn.Create(&model.Organization{
		ID:          orgID,
		DisplayName: "Test",
	}).Error)

	missingLedgerID := "20000000-0000-0000-0000-000000000002"

	doc := &Document{
		Version: Version,
		Accounts: []Account{
			{
				ID:          "10000000-0000-0000-0000-000000000001",
				DisplayName: "Root",
			},
		},
		LedgerAccounts: []LedgerAccount{
			{
				ID:          "20000000-0000-0000-0000-000000000001",
				Code:        "1000",
				AccountType: "asset",
				DisplayName: "Bank",
			},
		},
		Transactions: []Transaction{
			{
				ID:                    "40000000-0000-0000-0000-000000000001",
				CreditLedgerAccountID: "20000000-0000-0000-0000-000000000001",
				DebitLedgerAccountID:  missingLedgerID,
				Amount:                "50.00",
				BookedAt:              "2026-01-15",
				DocumentDate:          "2026-01-15",
				AssignedAccountID:     "10000000-0000-0000-0000-000000000001",
			},
		},
	}

	require.NoError(t, ImportDocument(ctx, dbConn, orgID, doc))

	var ledgerAccounts []model.LedgerAccount
	require.NoError(t, dbConn.Where("organization_id = ?", orgID).Find(&ledgerAccounts).Error)
	require.Len(t, ledgerAccounts, 2)

	var found bool
	for _, la := range ledgerAccounts {
		if la.ID.String() == missingLedgerID {
			found = true
			require.Equal(t, missingLedgerID, la.Code)
			require.Equal(t, model.AccountTypeUnspecified, la.AccountType)
		}
	}
	require.True(t, found, "missing ledger account was not auto-created")
}
