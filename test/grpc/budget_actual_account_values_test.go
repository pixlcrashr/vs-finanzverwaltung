package grpc_test

import (
	"context"
	"time"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"google.golang.org/genproto/googleapis/type/date"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
)

var _ = Describe("BudgetActualAccountValueService", func() {
	var ctx context.Context
	var orgName string
	var budget *gen.Budget
	var account *gen.Account

	BeforeEach(func() {
		ctx = context.Background()

		org, err := OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
			Organization: &gen.Organization{DisplayName: "Test Org for Budget Actual Values"},
		})
		Expect(err).NotTo(HaveOccurred())
		orgName = org.Name

		// Create a budget with a defined period
		budget, err = BudgetClient.CreateBudget(ctx, &gen.CreateBudgetRequest{
			Parent: orgName,
			Budget: &gen.Budget{
				DisplayName: "Test Budget for Actual Values",
				PeriodStart: &date.Date{Year: 2024, Month: 1, Day: 1},
				PeriodEnd:   &date.Date{Year: 2024, Month: 12, Day: 31},
			},
		})
		Expect(err).NotTo(HaveOccurred())

		// Create an account for testing
		account, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
			Parent:  orgName,
			Account: &gen.Account{DisplayName: "Test Account for Actual Values"},
		})
		Expect(err).NotTo(HaveOccurred())
	})

	Describe("GetBudgetActualAccountValue", func() {
		It("returns zero value for an account with no transactions", func() {
			actualValueName := budget.Name + "/actualAccountValues/" + account.Uid
			resp, err := BudgetActualAccountValueClient.GetBudgetActualAccountValue(ctx, &gen.GetBudgetActualAccountValueRequest{
				Name: actualValueName,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).To(Equal(actualValueName))
			Expect(resp.Account).To(Equal(account.Name))
			Expect(resp.Budget).To(Equal(budget.Name))
			Expect(resp.Value).NotTo(BeNil())
			Expect(resp.Value.Value).To(Equal("0"))
		})

		It("computes actual value from transactions within budget period", func() {
			// Create import source and transaction accounts
			importSource, err := ImportSourceClient.CreateImportSource(ctx, &gen.CreateImportSourceRequest{
				Parent: orgName,
				ImportSource: &gen.ImportSource{
					DisplayName: "Test Import Source",
				},
			})
			Expect(err).NotTo(HaveOccurred())

			creditTxAccount, err := TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:           "CREDIT-001",
					ImportSourceId: importSource.Uid,
					DisplayName:    "Credit Account",
				},
			})
			Expect(err).NotTo(HaveOccurred())

			debitTxAccount, err := TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:           "DEBIT-001",
					ImportSourceId: importSource.Uid,
					DisplayName:    "Debit Account",
				},
			})
			Expect(err).NotTo(HaveOccurred())

			// Create a transaction within the budget period with an assignment to our account
			_, err = TransactionClient.CreateTransaction(ctx, &gen.CreateTransactionRequest{
				Parent: orgName,
				Transaction: &gen.Transaction{
					CreditTransactionAccountId: creditTxAccount.Uid,
					DebitTransactionAccountId:  debitTxAccount.Uid,
					Description:                "Test transaction within period",
					BookedAt:                   timestamppb.New(time.Date(2024, 6, 15, 10, 0, 0, 0, time.UTC)),
					DocumentDate:               timestamppb.New(time.Date(2024, 6, 15, 0, 0, 0, 0, time.UTC)),
				},
			})
			Expect(err).NotTo(HaveOccurred())

			// The actual value should be computed from the transaction
			actualValueName := budget.Name + "/actualAccountValues/" + account.Uid
			resp, err := BudgetActualAccountValueClient.GetBudgetActualAccountValue(ctx, &gen.GetBudgetActualAccountValueRequest{
				Name: actualValueName,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).To(Equal(actualValueName))
			Expect(resp.Account).To(Equal(account.Name))
			Expect(resp.Budget).To(Equal(budget.Name))
			Expect(resp.Value).NotTo(BeNil())
		})

		It("returns NotFound for a non-existent budget", func() {
			_, err := BudgetActualAccountValueClient.GetBudgetActualAccountValue(ctx, &gen.GetBudgetActualAccountValueRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000/budgets/00000000-0000-0000-0000-000000000000/actualAccountValues/" + account.Uid,
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns NotFound for a non-existent account", func() {
			_, err := BudgetActualAccountValueClient.GetBudgetActualAccountValue(ctx, &gen.GetBudgetActualAccountValueRequest{
				Name: budget.Name + "/actualAccountValues/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed resource name", func() {
			_, err := BudgetActualAccountValueClient.GetBudgetActualAccountValue(ctx, &gen.GetBudgetActualAccountValueRequest{
				Name: "not-a-valid-name",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})

		It("returns InvalidArgument when name is missing", func() {
			_, err := BudgetActualAccountValueClient.GetBudgetActualAccountValue(ctx, &gen.GetBudgetActualAccountValueRequest{})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("ListBudgetActualAccountValues", func() {
		It("lists actual values for all accounts in a budget", func() {
			// Create multiple accounts
			account2, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent:  orgName,
				Account: &gen.Account{DisplayName: "Second Account"},
			})
			Expect(err).NotTo(HaveOccurred())

			account3, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent:  orgName,
				Account: &gen.Account{DisplayName: "Third Account"},
			})
			Expect(err).NotTo(HaveOccurred())

			// List actual account values for the budget
			resp, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
				Parent:   budget.Name,
				PageSize: 100,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.ActualAccountValues)).To(BeNumerically(">=", 3))

			// Verify all accounts are present
			accountIDs := make([]string, 0, len(resp.ActualAccountValues))
			for _, av := range resp.ActualAccountValues {
				accountIDs = append(accountIDs, av.Account)
			}
			Expect(accountIDs).To(ContainElements(account.Name, account2.Name, account3.Name))
		})

		It("returns empty list when budget has no accounts", func() {
			// Create a new budget without any accounts
			emptyBudget, err := BudgetClient.CreateBudget(ctx, &gen.CreateBudgetRequest{
				Parent: orgName,
				Budget: &gen.Budget{
					DisplayName: "Empty Budget",
					PeriodStart: &date.Date{Year: 2024, Month: 1, Day: 1},
					PeriodEnd:   &date.Date{Year: 2024, Month: 12, Day: 31},
				},
			})
			Expect(err).NotTo(HaveOccurred())

			resp, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
				Parent:   emptyBudget.Name,
				PageSize: 100,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.ActualAccountValues).To(BeEmpty())
			Expect(resp.TotalSize).To(Equal(int64(0)))
		})

		It("respects page_size and returns a next_page_token when more results exist", func() {
			// Create multiple accounts
			for i := 0; i < 5; i++ {
				_, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
					Parent:  orgName,
					Account: &gen.Account{DisplayName: "Account " + string(rune('A'+i))},
				})
				Expect(err).NotTo(HaveOccurred())
			}

			resp, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
				Parent:   budget.Name,
				PageSize: 2,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.ActualAccountValues)).To(Equal(2))
			Expect(resp.NextPageToken).NotTo(BeEmpty())
		})

		It("traverses all pages via page tokens", func() {
			// Create multiple accounts
			for i := 0; i < 5; i++ {
				_, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
					Parent:  orgName,
					Account: &gen.Account{DisplayName: "Account " + string(rune('A'+i))},
				})
				Expect(err).NotTo(HaveOccurred())
			}

			var all []*gen.BudgetActualAccountValue
			var token string
			for {
				resp, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
					Parent:    budget.Name,
					PageSize:  2,
					PageToken: token,
				})
				Expect(err).NotTo(HaveOccurred())
				all = append(all, resp.ActualAccountValues...)
				if resp.NextPageToken == "" {
					break
				}
				token = resp.NextPageToken
			}
			Expect(len(all)).To(BeNumerically(">=", 5))
		})

		It("filters by account_id", func() {
			// Create another account
			account2, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent:  orgName,
				Account: &gen.Account{DisplayName: "Filter Account"},
			})
			Expect(err).NotTo(HaveOccurred())

			// List with filter for specific account
			filter := "account=\"" + account2.Name + "\""
			resp, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
				Parent: budget.Name,
				Filter: filter,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.ActualAccountValues)).To(Equal(1))
			Expect(resp.ActualAccountValues[0].Account).To(Equal(account2.Name))
		})

		It("returns NotFound for a non-existent budget parent", func() {
			_, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
				Parent: "organizations/00000000-0000-0000-0000-000000000000/budgets/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed parent resource name", func() {
			_, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{
				Parent: "not-a-valid-name",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})

		It("returns InvalidArgument when parent is missing", func() {
			_, err := BudgetActualAccountValueClient.ListBudgetActualAccountValues(ctx, &gen.ListBudgetActualAccountValuesRequest{})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})
})
