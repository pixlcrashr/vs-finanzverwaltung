package repository_test

import (
	"database/sql"
	"testing"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/pixlcrashr/vsfv/pkg/db"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"

	_ "github.com/lib/pq"
)

const testDSN = "postgres://vsf:postgres@127.0.0.1:5335/vsf?sslmode=disable"

var (
	dbConn *gorm.DB
	sqlDB  *sql.DB

	// Repositories
	BudgetActualAccountValueRepo *repository.BudgetActualAccountValueRepository
	BudgetRepo                   *repository.BudgetRepository
	OrganizationRepo             *repository.OrganizationRepository
	AccountRepo                  *repository.AccountRepository
	TransactionRepo              *repository.TransactionRepository
	LedgerAccountRepo            *repository.LedgerAccountRepository
	LedgerYearRepo               *repository.LedgerYearRepository
	BudgetAccountValueRepo       *repository.BudgetAccountValueRepository
	TransactionAssignmentRepo    *repository.TransactionAssignmentRepository
)

func TestRepository(t *testing.T) {
	RegisterFailHandler(Fail)
	RunSpecs(t, "Repository Suite")
}

// resetSchema drops and recreates the public schema, then runs migrations.
// Accepts an existing sql.DB to reuse connections.
func resetSchema(sqlDB *sql.DB) {
	By("resetting the test DB schema")
	_, err := sqlDB.Exec("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;")
	Expect(err).NotTo(HaveOccurred())

	By("applying all migrations on the clean schema")
	err = db.Run(sqlDB)
	Expect(err).NotTo(HaveOccurred())
}

var _ = BeforeSuite(func() {
	By("opening database connection")
	var err error
	sqlDB, err = sql.Open("postgres", testDSN)
	Expect(err).NotTo(HaveOccurred())

	// Initial schema setup
	resetSchema(sqlDB)

	By("connecting with GORM")
	dbConn, err = db.Connect(testDSN)
	dbConn.Logger = dbConn.Logger.LogMode(logger.Silent)
	Expect(err).NotTo(HaveOccurred())

	By("initializing repositories")
	BudgetActualAccountValueRepo = repository.NewBudgetActualAccountValueRepository(dbConn)
	BudgetRepo = repository.NewBudgetRepository(dbConn)
	OrganizationRepo = repository.NewOrganizationRepository(dbConn)
	AccountRepo = repository.NewAccountRepository(dbConn)
	TransactionRepo = repository.NewTransactionRepository(dbConn)
	LedgerAccountRepo = repository.NewLedgerAccountRepository(dbConn)
	LedgerYearRepo = repository.NewLedgerYearRepository(dbConn)
	BudgetAccountValueRepo = repository.NewBudgetAccountValueRepository(dbConn)
	TransactionAssignmentRepo = repository.NewTransactionAssignmentRepository(dbConn)

	DeferCleanup(func() {
		_ = sqlDB.Close()
	})
})

var _ = BeforeEach(func() {
	// Reset schema for each test to ensure completely isolated state
	resetSchema(sqlDB)
})
