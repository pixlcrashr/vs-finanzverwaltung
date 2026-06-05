# gRPC Integration Tests Implementation

## Objective
Implement integration tests for 4 core gRPC services following the OrganizationService test pattern.

## Services to Test
1. **AccountService** - Full CRUD + Archive + nested account methods
2. **BudgetService** - Full CRUD + Close
3. **TransactionAccountService** - Full CRUD
4. **TransactionService** - Full CRUD

## Changes Required

### 1. Update `test/grpc/grpc_suite_test.go`
- Register all 4 service servers on the test gRPC server
- Add global client variables for each service
- Keep existing OrganizationService setup

### 2. Create `test/grpc/accounts_test.go`
- CreateOrganization helper (prerequisite)
- CreateAccount happy path + validation errors
- GetAccount happy path + NotFound + InvalidArgument
- ListAccounts with pagination
- ListNestedAccounts custom method
- GetNestedAccount custom method
- UpdateAccount happy path + NotFound
- ArchiveAccount (soft delete) + test show_deleted filter
- DeleteAccount permanent delete + NotFound

### 3. Create `test/grpc/budgets_test.go`
- CreateOrganization helper
- CreateBudget happy path
- GetBudget happy path + NotFound
- ListBudgets with pagination
- UpdateBudget happy path
- CloseBudget custom method
- DeleteBudget + verify NotFound

### 4. Create `test/grpc/transaction_accounts_test.go`
- CreateOrganization helper
- CreateImportSource helper (prerequisite for TransactionAccount)
- CreateTransactionAccount happy path
- GetTransactionAccount happy path + NotFound
- ListTransactionAccounts with pagination
- UpdateTransactionAccount happy path
- DeleteTransactionAccount + verify NotFound

### 5. Create `test/grpc/transactions_test.go`
- CreateOrganization helper
- CreateAccount helper (prerequisite for Transaction)
- CreateTransaction happy path with all required fields
- GetTransaction happy path + NotFound
- ListTransactions with pagination
- UpdateTransaction happy path
- DeleteTransaction + verify NotFound

## Dependencies Between Services
- All services need Organization (created via OrgClient)
- TransactionAccount needs ImportSource
- Transaction needs Account

## Test Pattern (from organizations_test.go)
- Use Ginkgo Describe/Context/It blocks
- Use BeforeEach for context setup
- Create prerequisites in BeforeEach
- Test happy paths and error cases (codes.NotFound, codes.InvalidArgument)
- Test pagination with page_size and page_token

## Verification
Run `go test ./test/grpc/...` - all tests should pass.
