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
		Organization:               newOrganizationServiceServer(repository.NewOrganizationRepository(db), enforcer),
		Account:                    newAccountServiceServer(repository.NewAccountRepository(db), enforcer),
		AccountGroup:               newAccountGroupServiceServer(repository.NewAccountGroupRepository(db), enforcer),
		AccountGroupAssignment:     newAccountGroupAssignmentServiceServer(repository.NewAccountGroupAssignmentRepository(db), enforcer),
		Budget:                     newBudgetServiceServer(repository.NewBudgetRepository(db), enforcer),
		BudgetRevision:             newBudgetRevisionServiceServer(repository.NewBudgetRevisionRepository(db), repository.NewBudgetRepository(db), enforcer),
		BudgetRevisionAccountValue: newBudgetRevisionAccountValueServiceServer(repository.NewBudgetRevisionAccountValueRepository(db), repository.NewAccountRepository(db), enforcer),
		BudgetAccountValue:         newBudgetAccountValueServiceServer(repository.NewBudgetAccountValueRepository(db), repository.NewAccountRepository(db), enforcer),
		BudgetActualAccountValue:   newBudgetActualAccountValueServiceServer(repository.NewBudgetActualAccountValueRepository(db), repository.NewBudgetRepository(db), enforcer),
		LedgerYear:                 newLedgerYearServiceServer(repository.NewLedgerYearRepository(db), enforcer),
		LedgerAccount:              newLedgerAccountServiceServer(repository.NewLedgerAccountRepository(db), enforcer),
		Transaction:                newTransactionServiceServer(repository.NewTransactionRepository(db), repository.NewLedgerAccountRepository(db), enforcer),
		TransactionAssignment:      newTransactionAssignmentServiceServer(repository.NewTransactionAssignmentRepository(db), repository.NewAccountRepository(db), enforcer),
		ReportTemplate:             newReportTemplateServiceServer(repository.NewReportTemplateRepository(db), enforcer),
		Report:                     newReportServiceServer(repository.NewReportRepository(db), enforcer),
		User:                       newUserServiceServer(repository.NewUserRepository(db), repository.NewUserGroupRepository(db, enforcer), enforcer),
		UserSettings:               newUserSettingsServiceServer(repository.NewUserSettingsRepository(db), enforcer),
		UserIdentity:               newUserIdentityServiceServer(repository.NewUserIdentityRepository(db), enforcer),
		Group:                      newGroupServiceServer(repository.NewUserGroupRepository(db, enforcer), enforcer),
	}
}
