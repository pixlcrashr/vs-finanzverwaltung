package services

import (
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"gorm.io/gorm"
)

// Services holds all gRPC service server implementations.
type Services struct {
	Organization                 gen.OrganizationServiceServer
	Account                      gen.AccountServiceServer
	AccountGroup                 gen.AccountGroupServiceServer
	AccountGroupAssignment       gen.AccountGroupAssignmentServiceServer
	Budget                       gen.BudgetServiceServer
	BudgetRevision               gen.BudgetRevisionServiceServer
	BudgetRevisionAccountValue   gen.BudgetRevisionAccountValueServiceServer
	BudgetAccountValue           gen.BudgetAccountValueServiceServer
	ImportSource                 gen.ImportSourceServiceServer
	ImportSourcePeriod           gen.ImportSourcePeriodServiceServer
	Transaction                  gen.TransactionServiceServer
	TransactionAccount           gen.TransactionAccountServiceServer
	TransactionAccountAssignment gen.TransactionAccountAssignmentServiceServer
	ReportTemplate               gen.ReportTemplateServiceServer
	Report                       gen.ReportServiceServer
}

// New creates a Services instance wiring all concrete service implementations
// backed by repositories constructed from db.
func New(db *gorm.DB) *Services {
	return &Services{
		Organization:                 newOrganizationServiceServer(repository.NewOrganizationRepository(db)),
		Account:                      newAccountServiceServer(repository.NewAccountRepository(db)),
		AccountGroup:                 newAccountGroupServiceServer(repository.NewAccountGroupRepository(db)),
		AccountGroupAssignment:       newAccountGroupAssignmentServiceServer(repository.NewAccountGroupAssignmentRepository(db)),
		Budget:                       newBudgetServiceServer(repository.NewBudgetRepository(db)),
		BudgetRevision:               newBudgetRevisionServiceServer(repository.NewBudgetRevisionRepository(db), repository.NewBudgetRepository(db)),
		BudgetRevisionAccountValue:   newBudgetRevisionAccountValueServiceServer(repository.NewBudgetRevisionAccountValueRepository(db)),
		BudgetAccountValue:           newBudgetAccountValueServiceServer(repository.NewBudgetAccountValueRepository(db)),
		ImportSource:                 newImportSourceServiceServer(repository.NewImportSourceRepository(db)),
		ImportSourcePeriod:           newImportSourcePeriodServiceServer(repository.NewImportSourcePeriodRepository(db)),
		Transaction:                  newTransactionServiceServer(repository.NewTransactionRepository(db)),
		TransactionAccount:           newTransactionAccountServiceServer(repository.NewTransactionAccountRepository(db)),
		TransactionAccountAssignment: newTransactionAccountAssignmentServiceServer(repository.NewTransactionAccountAssignmentRepository(db)),
		ReportTemplate:               newReportTemplateServiceServer(repository.NewReportTemplateRepository(db)),
		Report:                       newReportServiceServer(repository.NewReportRepository(db)),
	}
}
