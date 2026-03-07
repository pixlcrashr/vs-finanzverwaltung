package api

import (
	"github.com/danielgtaylor/huma/v2"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/api/accountgroupassignments"
	"github.com/pixlcrashr/vsfv/pkg/api/accountgroups"
	"github.com/pixlcrashr/vsfv/pkg/api/accounts"
	"github.com/pixlcrashr/vsfv/pkg/api/budgetrevisions"
	"github.com/pixlcrashr/vsfv/pkg/api/budgets"
	"github.com/pixlcrashr/vsfv/pkg/api/importsourceperiods"
	"github.com/pixlcrashr/vsfv/pkg/api/importsources"
	"github.com/pixlcrashr/vsfv/pkg/api/reports"
	"github.com/pixlcrashr/vsfv/pkg/api/reporttemplates"
	"github.com/pixlcrashr/vsfv/pkg/api/transactionaccounts"
	"github.com/pixlcrashr/vsfv/pkg/api/transactionassignments"
	"github.com/pixlcrashr/vsfv/pkg/api/transactions"
)

// RegisterRoutes wires all domain route groups onto the Huma API.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	// Core resources
	accounts.RegisterRoutes(api, db)
	accountgroups.RegisterRoutes(api, db)
	budgets.RegisterRoutes(api, db)
	importsources.RegisterRoutes(api, db)
	transactions.RegisterRoutes(api, db)
	transactionaccounts.RegisterRoutes(api, db)

	// Nested/sub-resources
	budgetrevisions.RegisterRoutes(api, db)
	accountgroupassignments.RegisterRoutes(api, db)
	transactionassignments.RegisterRoutes(api, db)
	importsourceperiods.RegisterRoutes(api, db)

	// Reports
	reporttemplates.RegisterRoutes(api, db)
	reports.RegisterRoutes(api, db)
}
