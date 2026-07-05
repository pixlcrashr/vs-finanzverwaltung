package services

import (
	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	"gorm.io/gorm"
)

// Services holds all gRPC service server implementations.
type Services struct {
	Organization               gen.OrganizationServiceServer
	Account                    gen.AccountServiceServer
	AccountGroup               gen.AccountGroupServiceServer
	AccountGroupAssignment     gen.AccountGroupAssignmentServiceServer
	Budget                     gen.BudgetServiceServer
	BudgetRevision             gen.BudgetRevisionServiceServer
	BudgetRevisionAccountValue gen.BudgetRevisionAccountValueServiceServer
	BudgetAccountValue         gen.BudgetAccountValueServiceServer
	BudgetActualAccountValue   gen.BudgetActualAccountValueServiceServer
	LedgerYear                 gen.LedgerYearServiceServer
	LedgerAccount              gen.LedgerAccountServiceServer
	Transaction                gen.TransactionServiceServer
	TransactionAssignment      gen.TransactionAssignmentServiceServer
	ReportTemplate             gen.ReportTemplateServiceServer
	Report                     gen.ReportServiceServer
	User                       gen.UserServiceServer
	UserSettings               gen.UserSettingsServiceServer
	UserIdentity               gen.UserIdentityServiceServer
	Group                      gen.GroupServiceServer
}

// New creates a Services instance wiring all concrete service implementations
// backed by repositories constructed from db.
func New(db *gorm.DB, enforcer *authz.Enforcer) *Services {
	return &Services{
		Organization:               newOrganizationServiceServer(repository.NewOrganizationRepository(db)),
		Account:                    newAccountServiceServer(repository.NewAccountRepository(db)),
		AccountGroup:               newAccountGroupServiceServer(repository.NewAccountGroupRepository(db)),
		AccountGroupAssignment:     newAccountGroupAssignmentServiceServer(repository.NewAccountGroupAssignmentRepository(db)),
		Budget:                     newBudgetServiceServer(repository.NewBudgetRepository(db)),
		BudgetRevision:             newBudgetRevisionServiceServer(repository.NewBudgetRevisionRepository(db), repository.NewBudgetRepository(db)),
		BudgetRevisionAccountValue: newBudgetRevisionAccountValueServiceServer(repository.NewBudgetRevisionAccountValueRepository(db)),
		BudgetAccountValue:         newBudgetAccountValueServiceServer(repository.NewBudgetAccountValueRepository(db)),
		BudgetActualAccountValue:   newBudgetActualAccountValueServiceServer(repository.NewBudgetActualAccountValueRepository(db), repository.NewBudgetRepository(db)),
		LedgerYear:                 newLedgerYearServiceServer(repository.NewLedgerYearRepository(db)),
		LedgerAccount:              newLedgerAccountServiceServer(repository.NewLedgerAccountRepository(db)),
		Transaction:                newTransactionServiceServer(repository.NewTransactionRepository(db), repository.NewLedgerAccountRepository(db)),
		TransactionAssignment:      newTransactionAssignmentServiceServer(repository.NewTransactionAssignmentRepository(db), repository.NewAccountRepository(db)),
		ReportTemplate:             newReportTemplateServiceServer(repository.NewReportTemplateRepository(db)),
		Report:                     newReportServiceServer(repository.NewReportRepository(db)),
		User:                       newUserServiceServer(repository.NewUserRepository(db), enforcer),
		UserSettings:               newUserSettingsServiceServer(repository.NewUserSettingsRepository(db)),
		UserIdentity:               newUserIdentityServiceServer(repository.NewUserIdentityRepository(db)),
		Group:                      newGroupServiceServer(repository.NewUserGroupRepository(db, enforcer)),
	}
}
