package repository_test

import (
	"context"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"

	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
)

var _ = Describe("BudgetActualAccountValueRepository", func() {
	var ctx context.Context

	// Helper to create an organization
	createOrganization := func(name string) *model.Organization {
		org, err := OrganizationRepo.Create(ctx, repository.CreateOrganizationParams{
			DisplayName: name,
			CustomID:    uuid.New().String(),
		})
		Expect(err).NotTo(HaveOccurred())
		return org
	}

	// Helper to create an account
	createAccount := func(orgID uuid.UUID, name string) *model.Account {
		acc, err := AccountRepo.Create(ctx, repository.CreateAccountParams{
			OrganizationID: orgID,
			DisplayName:    name,
			CustomID:       uuid.New().String(),
			IsContainer:    false,
			IsArchived:     false,
		})
		Expect(err).NotTo(HaveOccurred())
		return acc
	}

	// Helper to create a budget
	createBudget := func(orgID uuid.UUID, startDate, endDate time.Time) *model.Budget {
		budget, err := BudgetRepo.Create(ctx, repository.CreateBudgetParams{
			OrganizationID: orgID,
			DisplayName:    "Test Budget",
			PeriodStart:    startDate,
			PeriodEnd:      endDate,
			CustomID:       uuid.New().String(),
		})
		Expect(err).NotTo(HaveOccurred())
		return budget
	}

	// Helper to create ledger account with specific type
	createLedgerAccount := func(orgID uuid.UUID, code string, accountType model.AccountType) *model.LedgerAccount {
		acc, err := LedgerAccountRepo.Create(ctx, repository.CreateLedgerAccountParams{
			OrganizationID: orgID,
			Code:           code,
			AccountType:    accountType,
			DisplayName:    "Ledger Account " + code,
			CustomID:       uuid.New().String(),
		})
		Expect(err).NotTo(HaveOccurred())
		return acc
	}

	// Helper to create transaction
	createTransaction := func(orgID, creditLedgerAccID, debitLedgerAccID uuid.UUID, docDate time.Time, amount string) *model.Transaction_ {
		tx, err := TransactionRepo.Create(ctx, repository.CreateTransactionParams{
			OrganizationID:        orgID,
			CreditLedgerAccountID: creditLedgerAccID,
			DebitLedgerAccountID:  debitLedgerAccID,
			Description:           "Test transaction",
			DocumentDate:          docDate,
			BookedAt:              docDate,
		})
		Expect(err).NotTo(HaveOccurred())
		return tx
	}

	// Helper to create transaction assignment
	createAssignment := func(orgID, txID, accountID uuid.UUID, value string) {
		val := apd.Decimal{}
		_, _, err := val.SetString(value)
		Expect(err).NotTo(HaveOccurred())

		err = dbConn.WithContext(ctx).Exec(
			"INSERT INTO transaction_assignments (id, organization_id, transaction_id, account_id, value) VALUES (?, ?, ?, ?, ?)",
			uuid.New(), orgID, txID, accountID, val,
		).Error
		Expect(err).NotTo(HaveOccurred())
	}

	Describe("ListByBudget", func() {
		It("returns empty list when budget has no transactions", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)
			createBudget(org.ID, startDate, endDate)
			// Create an account but no transactions
			createAccount(org.ID, "Test Account")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(BeEmpty())
		})

		It("computes actual values from transactions within budget period", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Revenue Account")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Create transaction within budget period
			tx := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx.ID, account.ID, "1000.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(1))
			Expect(result[0].AccountID).To(Equal(account.ID))
			Expect(result[0].Value.String()).To(Equal("-1000.00"))
		})

		It("excludes transactions outside budget period", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Revenue Account")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Create transaction BEFORE budget period
			tx1 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2023, 6, 15, 0, 0, 0, 0, time.UTC), "500.00")
			createAssignment(org.ID, tx1.ID, account.ID, "500.00")

			// Create transaction AFTER budget period
			tx2 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2025, 6, 15, 0, 0, 0, 0, time.UTC), "500.00")
			createAssignment(org.ID, tx2.ID, account.ID, "500.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(BeEmpty())
		})

		It("computes net value from multiple assignments", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Revenue Account")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Multiple transactions for same account
			tx1 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account.ID, "1000.00")

			tx2 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "2000.00")
			createAssignment(org.ID, tx2.ID, account.ID, "2000.00")

			tx3 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 9, 15, 0, 0, 0, 0, time.UTC), "500.00")
			createAssignment(org.ID, tx3.ID, account.ID, "500.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(1))
			Expect(result[0].Value.String()).To(Equal("-3500.00"))
		})

		It("computes values for multiple accounts", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account1 := createAccount(org.ID, "Revenue Account")
			account2 := createAccount(org.ID, "Expense Account")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Transaction for account 1
			tx1 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account1.ID, "1000.00")

			// Transaction for account 2
			tx2 := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 7, 15, 0, 0, 0, 0, time.UTC), "2000.00")
			createAssignment(org.ID, tx2.ID, account2.ID, "2000.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(2))

			// Find values by account
			var value1, value2 string
			for _, r := range result {
				if r.AccountID == account1.ID {
					value1 = r.Value.String()
				}
				if r.AccountID == account2.ID {
					value2 = r.Value.String()
				}
			}
			Expect(value1).To(Equal("-1000.00"))
			Expect(value2).To(Equal("-2000.00"))
		})

		It("orders results by account_id", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account1 := createAccount(org.ID, "Account A")
			account2 := createAccount(org.ID, "Account B")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			tx := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx.ID, account1.ID, "500.00")
			createAssignment(org.ID, tx.ID, account2.ID, "500.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(2))
			// Should be ordered by account_id
			Expect(result[0].AccountID.String() < result[1].AccountID.String()).To(BeTrue())
		})

		It("computes values correctly with different credit/debit accounts per transaction", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Test Account")
			// Create two different pairs of ledger accounts
			creditTxAcc1 := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc1 := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)
			creditTxAcc2 := createLedgerAccount(org.ID, "BANK-002", model.AccountTypeAsset)
			debitTxAcc2 := createLedgerAccount(org.ID, "EXP-001", model.AccountTypeExpense)

			// Transaction 1: BANK-001 -> REV-001
			tx1 := createTransaction(org.ID, creditTxAcc1.ID, debitTxAcc1.ID, time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account.ID, "1000.00")

			// Transaction 2: BANK-002 -> EXP-001 (different credit/debit accounts)
			tx2 := createTransaction(org.ID, creditTxAcc2.ID, debitTxAcc2.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "2000.00")
			createAssignment(org.ID, tx2.ID, account.ID, "2000.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(1))
			Expect(result[0].Value.String()).To(Equal("-3000.00"))
		})

		It("computes net value when previous debit account becomes credit account", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Test Account")

			// Create ledger accounts
			creditTxAcc1 := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc1 := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Transaction 1: BANK-001 -> REV-001 (forward flow)
			tx1 := createTransaction(org.ID, creditTxAcc1.ID, debitTxAcc1.ID, time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account.ID, "1000.00")

			// Transaction 2: REV-001 -> BANK-001 (reverse flow, debit becomes credit)
			tx2 := createTransaction(org.ID, debitTxAcc1.ID, creditTxAcc1.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "300.00")
			createAssignment(org.ID, tx2.ID, account.ID, "300.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(1))
			// Net value should be 1000 - 300 = 700
			Expect(result[0].Value.String()).To(Equal("-700.00"))
		})

		It("computes values correctly for multiple accounts with reverse flows", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account1 := createAccount(org.ID, "Account A")
			account2 := createAccount(org.ID, "Account B")

			// Create ledger accounts
			creditTxAcc1 := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc1 := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Transaction 1: Forward flow for account1
			tx1 := createTransaction(org.ID, creditTxAcc1.ID, debitTxAcc1.ID, time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account1.ID, "1000.00")

			// Transaction 2: Reverse flow for account1 (partial reversal)
			tx2 := createTransaction(org.ID, debitTxAcc1.ID, creditTxAcc1.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "200.00")
			createAssignment(org.ID, tx2.ID, account1.ID, "200.00")

			// Transaction 3: Forward flow for account2 only
			tx3 := createTransaction(org.ID, creditTxAcc1.ID, debitTxAcc1.ID, time.Date(2024, 9, 15, 0, 0, 0, 0, time.UTC), "500.00")
			createAssignment(org.ID, tx3.ID, account2.ID, "500.00")

			result, err := BudgetActualAccountValueRepo.ListByBudget(ctx, org.ID, startDate, endDate)
			Expect(err).NotTo(HaveOccurred())
			Expect(result).To(HaveLen(2))

			// Find values by account
			var value1, value2 string
			for _, r := range result {
				if r.AccountID == account1.ID {
					value1 = r.Value.String()
				}
				if r.AccountID == account2.ID {
					value2 = r.Value.String()
				}
			}
			// account1: -1000 + 200 = -800 (both tx have ASSET credit = negative)
			Expect(value1).To(Equal("-800.00"))
			// account2: -500
			Expect(value2).To(Equal("-500.00"))
		})
	})

	Describe("GetByBudgetAndAccount", func() {
		It("returns actual value for specific account", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Specific Account")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			tx := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx.ID, account.ID, "1000.00")

			result, err := BudgetActualAccountValueRepo.GetByBudgetAndAccount(ctx, org.ID, startDate, endDate, account.CustomID)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.AccountID).To(Equal(account.ID))
			Expect(result.AccountCustomID).To(Equal(account.CustomID))
			Expect(result.Value.String()).To(Equal("-1000.00"))
		})

		It("returns not found when account has no transactions", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)
			account := createAccount(org.ID, "Unused Account")

			_, err := BudgetActualAccountValueRepo.GetByBudgetAndAccount(ctx, org.ID, startDate, endDate, account.CustomID)
			Expect(err).To(HaveOccurred())
			Expect(err).To(Equal(repository.ErrBudgetActualAccountValueNotFound))
		})

		It("returns not found for non-existent account", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			_, err := BudgetActualAccountValueRepo.GetByBudgetAndAccount(ctx, org.ID, startDate, endDate, "non-existent-id")
			Expect(err).To(HaveOccurred())
			Expect(err).To(Equal(repository.ErrBudgetActualAccountValueNotFound))
		})

		It("excludes transactions outside budget period", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Period Test Account")
			// ASSET account credited = expense/outflow (negative)
			creditTxAcc := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Create transaction outside period
			tx := createTransaction(org.ID, creditTxAcc.ID, debitTxAcc.ID, time.Date(2023, 6, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx.ID, account.ID, "1000.00")

			_, err := BudgetActualAccountValueRepo.GetByBudgetAndAccount(ctx, org.ID, startDate, endDate, account.CustomID)
			Expect(err).To(HaveOccurred())
			Expect(err).To(Equal(repository.ErrBudgetActualAccountValueNotFound))
		})

		It("returns correct net value with different credit/debit accounts", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Test Account")

			// Create two different pairs of ledger accounts
			creditTxAcc1 := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc1 := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)
			creditTxAcc2 := createLedgerAccount(org.ID, "BANK-002", model.AccountTypeAsset)
			debitTxAcc2 := createLedgerAccount(org.ID, "EXP-001", model.AccountTypeExpense)

			// Transaction 1: BANK-001 -> REV-001
			tx1 := createTransaction(org.ID, creditTxAcc1.ID, debitTxAcc1.ID, time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account.ID, "1000.00")

			// Transaction 2: BANK-002 -> EXP-001 (different accounts)
			tx2 := createTransaction(org.ID, creditTxAcc2.ID, debitTxAcc2.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "2000.00")
			createAssignment(org.ID, tx2.ID, account.ID, "2000.00")

			result, err := BudgetActualAccountValueRepo.GetByBudgetAndAccount(ctx, org.ID, startDate, endDate, account.CustomID)
			Expect(err).NotTo(HaveOccurred())
			Expect(result.Value.String()).To(Equal("-3000.00"))
		})

		It("returns correct net value when debit becomes credit", func() {
			org := createOrganization("Test Org")
			startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
			endDate := time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC)

			account := createAccount(org.ID, "Test Account")

			creditTxAcc1 := createLedgerAccount(org.ID, "BANK-001", model.AccountTypeAsset)
			debitTxAcc1 := createLedgerAccount(org.ID, "REV-001", model.AccountTypeRevenue)

			// Transaction 1: Forward flow
			tx1 := createTransaction(org.ID, creditTxAcc1.ID, debitTxAcc1.ID, time.Date(2024, 3, 15, 0, 0, 0, 0, time.UTC), "1000.00")
			createAssignment(org.ID, tx1.ID, account.ID, "1000.00")

			// Transaction 2: Reverse flow (debit becomes credit)
			tx2 := createTransaction(org.ID, debitTxAcc1.ID, creditTxAcc1.ID, time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC), "300.00")
			createAssignment(org.ID, tx2.ID, account.ID, "300.00")

			result, err := BudgetActualAccountValueRepo.GetByBudgetAndAccount(ctx, org.ID, startDate, endDate, account.CustomID)
			Expect(err).NotTo(HaveOccurred())
			// tx1: credit ASSET = -1000, tx2: credit REVENUE = +300, Net = -700
			Expect(result.Value.String()).To(Equal("-700.00"))
		})
	})
})
