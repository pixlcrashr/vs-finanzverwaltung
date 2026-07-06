package authz

// OAuth2 scopes are resource-scoped: each resource gets a :read and :write scope.
// The :write scope covers all mutating actions (create, update, delete, import).

const (
	ScopeOpenID  = "openid"
	ScopeProfile = "profile"
	ScopeEmail   = "email"
	ScopeOffline = "offline"
)

const (
	ScopeAccountsRead          = "accounts:read"
	ScopeAccountsWrite         = "accounts:write"
	ScopeAccountGroupsRead     = "accountGroups:read"
	ScopeAccountGroupsWrite    = "accountGroups:write"
	ScopeBudgetsRead           = "budgets:read"
	ScopeBudgetsWrite          = "budgets:write"
	ScopeJournalRead           = "journal:read"
	ScopeJournalWrite          = "journal:write"
	ScopeTransactionsRead      = "transactions:read"
	ScopeTransactionsWrite     = "transactions:write"
	ScopeMatrixRead            = "matrix:read"
	ScopeMatrixWrite           = "matrix:write"
	ScopeReportsRead           = "reports:read"
	ScopeReportsWrite          = "reports:write"
	ScopeReportTemplatesRead   = "reportTemplates:read"
	ScopeReportTemplatesWrite  = "reportTemplates:write"
	ScopeImportSourcesRead     = "importSources:read"
	ScopeImportSourcesWrite    = "importSources:write"
	ScopeDashboardRead         = "dashboard:read"
	ScopeUsersRead             = "users:read"
	ScopeUsersWrite            = "users:write"
	ScopeGroupsRead            = "groups:read"
	ScopeGroupsWrite           = "groups:write"
	ScopeSettingsRead          = "settings:read"
	ScopeSettingsWrite         = "settings:write"
	ScopeOrganizationsRead     = "organizations:read"
	ScopeOrganizationsWrite    = "organizations:write"
)

// AllAPIScopes lists all resource-scoped OAuth2 scopes (excluding OIDC identity scopes).
var AllAPIScopes = []string{
	ScopeAccountsRead, ScopeAccountsWrite,
	ScopeAccountGroupsRead, ScopeAccountGroupsWrite,
	ScopeBudgetsRead, ScopeBudgetsWrite,
	ScopeJournalRead, ScopeJournalWrite,
	ScopeTransactionsRead, ScopeTransactionsWrite,
	ScopeMatrixRead, ScopeMatrixWrite,
	ScopeReportsRead, ScopeReportsWrite,
	ScopeReportTemplatesRead, ScopeReportTemplatesWrite,
	ScopeImportSourcesRead, ScopeImportSourcesWrite,
	ScopeDashboardRead,
	ScopeUsersRead, ScopeUsersWrite,
	ScopeGroupsRead, ScopeGroupsWrite,
	ScopeSettingsRead, ScopeSettingsWrite,
	ScopeOrganizationsRead, ScopeOrganizationsWrite,
}

// ScopeToResource maps a scope string to its casbin resource name.
var ScopeToResource = map[string]string{
	ScopeAccountsRead:         ResourceAccounts,
	ScopeAccountsWrite:        ResourceAccounts,
	ScopeAccountGroupsRead:    ResourceAccountGroups,
	ScopeAccountGroupsWrite:   ResourceAccountGroups,
	ScopeBudgetsRead:          ResourceBudgets,
	ScopeBudgetsWrite:         ResourceBudgets,
	ScopeJournalRead:          ResourceJournal,
	ScopeJournalWrite:         ResourceJournal,
	ScopeTransactionsRead:     ResourceTransactions,
	ScopeTransactionsWrite:    ResourceTransactions,
	ScopeMatrixRead:           ResourceMatrix,
	ScopeMatrixWrite:          ResourceMatrix,
	ScopeReportsRead:          ResourceReports,
	ScopeReportsWrite:         ResourceReports,
	ScopeReportTemplatesRead:  ResourceReportTemplates,
	ScopeReportTemplatesWrite: ResourceReportTemplates,
	ScopeImportSourcesRead:    ResourceImportSources,
	ScopeImportSourcesWrite:   ResourceImportSources,
	ScopeDashboardRead:        ResourceDashboard,
	ScopeUsersRead:            ResourceUsers,
	ScopeUsersWrite:           ResourceUsers,
	ScopeGroupsRead:           ResourceGroups,
	ScopeGroupsWrite:          ResourceGroups,
	ScopeSettingsRead:         ResourceSettings,
	ScopeSettingsWrite:        ResourceSettings,
	ScopeOrganizationsRead:    "organizations",
	ScopeOrganizationsWrite:   "organizations",
}

// ResourceOrganizations is the casbin resource for organizations.
const ResourceOrganizations = "organizations"

// ActionToScope converts a casbin resource + action into the required OAuth2 scope.
// Read actions (read) map to :read. All mutating actions (create, update, delete, import) map to :write.
func ActionToScope(resource, action string) string {
	switch action {
	case ActionRead:
		return resource + ":read"
	default:
		return resource + ":write"
	}
}

// HasScope checks whether the given scopes list contains the required scope.
func HasScope(scopes []string, required string) bool {
	for _, s := range scopes {
		if s == required {
			return true
		}
	}
	return false
}
