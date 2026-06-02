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

var Models = []any{
	&model.AccountGroupAssignment{},
	&model.AccountGroup{},
	&model.Account{},
	&model.BudgetRevisionAccountValue{},
	&model.BudgetRevision{},
	&model.BudgetAccountValue{},
	&model.Budget{},
	&model.ImportSource{},
	&model.ImportSourcePeriod{},
	&model.Organization{},
	&model.TransactionAccount{},
	&model.Transaction_{},
	&model.TransactionAccountAssignment{},
	&model.ReportTemplate{},
	&model.Report{},
	&model.User{},
	&model.UserIdentity{},
	&model.UserGroup{},
	&model.CasbinRule{},
}

func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(Models...)
}
