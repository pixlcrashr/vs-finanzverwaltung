package db

import (
	"fmt"

	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	return db, nil
}

func ConnectSilent(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}
	return db, nil
}

var Models = []any{
	&model.AccountGroupAssignment{},
	&model.AccountGroup{},
	&model.Account{},
	&model.BudgetRevisionAccountValue{},
	&model.BudgetRevision{},
	&model.BudgetAccountValue{},
	&model.Budget{},
	&model.LedgerYear{},
	&model.LedgerAccount{},
	&model.Organization{},
	&model.Transaction_{},
	&model.TransactionAssignment{},
	&model.ReportTemplate{},
	&model.Report{},
	&model.User{},
	&model.UserIdentity{},
	&model.UserSettings{},
	&model.UserGroup{},
	&model.CasbinRule{},
	&model.OAuth2Client{},
	&model.OAuth2Token{},
	&model.AuthSession{},
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(Models...)
}
