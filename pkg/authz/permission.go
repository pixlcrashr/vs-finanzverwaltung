package authz

import gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"

// Permission encodes a resource/action pair used by casbin policies.
type Permission struct {
	Resource string
	Action   string
}

// Resources used in casbin policies.
const (
	ResourceDashboard       = "dashboard"
	ResourceAccounts        = "accounts"
	ResourceAccountGroups   = "accountGroups"
	ResourceBudgets         = "budgets"
	ResourceJournal         = "journal"
	ResourceLedgerAccount   = "ledgerAccount"
	ResourceLedgerYear      = "ledgerYear"
	ResourceTransactions    = "transactions"
	ResourceMatrix          = "matrix"
	ResourceReports         = "reports"
	ResourceReportTemplates = "reportTemplates"
	ResourceImportSources   = "importSources"
	ResourceUsers           = "users"
	ResourceGroups          = "groups"
	ResourceSettings        = "settings"
	ResourceOrganizations   = "organizations"
	ResourceReimbursements  = "reimbursements"
)

// Actions used in casbin policies.
const (
	ActionCreate     = "create"
	ActionRead       = "read"
	ActionUpdate     = "update"
	ActionDelete     = "delete"
	ActionImport     = "import"
	ActionArchive    = "archive"
	ActionClose      = "close"
	ActionComment    = "comment"
	ActionReadOwn    = "read_own"
	ActionCommentOwn = "comment_own"
	ActionUpdateOwn  = "update_own"
)

// Permissions maps each proto Permission enum value to a casbin resource/action pair.
var Permissions = map[gen.Permission]Permission{
	gen.Permission_PERMISSION_DASHBOARD_READ: {ResourceDashboard, ActionRead},

	gen.Permission_PERMISSION_ACCOUNTS_READ:    {ResourceAccounts, ActionRead},
	gen.Permission_PERMISSION_ACCOUNTS_CREATE:  {ResourceAccounts, ActionCreate},
	gen.Permission_PERMISSION_ACCOUNTS_UPDATE:  {ResourceAccounts, ActionUpdate},
	gen.Permission_PERMISSION_ACCOUNTS_DELETE:  {ResourceAccounts, ActionDelete},
	gen.Permission_PERMISSION_ACCOUNTS_ARCHIVE: {ResourceAccounts, ActionArchive},

	gen.Permission_PERMISSION_ACCOUNT_GROUPS_READ:   {ResourceAccountGroups, ActionRead},
	gen.Permission_PERMISSION_ACCOUNT_GROUPS_CREATE: {ResourceAccountGroups, ActionCreate},
	gen.Permission_PERMISSION_ACCOUNT_GROUPS_UPDATE: {ResourceAccountGroups, ActionUpdate},
	gen.Permission_PERMISSION_ACCOUNT_GROUPS_DELETE: {ResourceAccountGroups, ActionDelete},

	gen.Permission_PERMISSION_BUDGETS_READ:   {ResourceBudgets, ActionRead},
	gen.Permission_PERMISSION_BUDGETS_CREATE: {ResourceBudgets, ActionCreate},
	gen.Permission_PERMISSION_BUDGETS_UPDATE: {ResourceBudgets, ActionUpdate},
	gen.Permission_PERMISSION_BUDGETS_DELETE: {ResourceBudgets, ActionDelete},
	gen.Permission_PERMISSION_BUDGETS_CLOSE:  {ResourceBudgets, ActionClose},

	gen.Permission_PERMISSION_JOURNAL_READ:   {ResourceJournal, ActionRead},
	gen.Permission_PERMISSION_JOURNAL_IMPORT: {ResourceJournal, ActionImport},

	gen.Permission_PERMISSION_LEDGER_ACCOUNT_READ:   {ResourceLedgerAccount, ActionRead},
	gen.Permission_PERMISSION_LEDGER_ACCOUNT_UPDATE: {ResourceLedgerAccount, ActionUpdate},
	gen.Permission_PERMISSION_LEDGER_ACCOUNT_DELETE: {ResourceLedgerAccount, ActionDelete},

	gen.Permission_PERMISSION_LEDGER_YEAR_READ:   {ResourceLedgerYear, ActionRead},
	gen.Permission_PERMISSION_LEDGER_YEAR_CREATE: {ResourceLedgerYear, ActionCreate},
	gen.Permission_PERMISSION_LEDGER_YEAR_CLOSE:  {ResourceLedgerYear, ActionClose},
	gen.Permission_PERMISSION_LEDGER_YEAR_DELETE: {ResourceLedgerYear, ActionDelete},

	gen.Permission_PERMISSION_TRANSACTIONS_READ:   {ResourceTransactions, ActionRead},
	gen.Permission_PERMISSION_TRANSACTIONS_UPDATE: {ResourceTransactions, ActionUpdate},
	gen.Permission_PERMISSION_TRANSACTIONS_DELETE: {ResourceTransactions, ActionDelete},

	gen.Permission_PERMISSION_MATRIX_READ:   {ResourceMatrix, ActionRead},
	gen.Permission_PERMISSION_MATRIX_UPDATE: {ResourceMatrix, ActionUpdate},

	gen.Permission_PERMISSION_REPORTS_READ:   {ResourceReports, ActionRead},
	gen.Permission_PERMISSION_REPORTS_CREATE: {ResourceReports, ActionCreate},
	gen.Permission_PERMISSION_REPORTS_DELETE: {ResourceReports, ActionDelete},

	gen.Permission_PERMISSION_REPORT_TEMPLATES_READ:   {ResourceReportTemplates, ActionRead},
	gen.Permission_PERMISSION_REPORT_TEMPLATES_CREATE: {ResourceReportTemplates, ActionCreate},
	gen.Permission_PERMISSION_REPORT_TEMPLATES_UPDATE: {ResourceReportTemplates, ActionUpdate},
	gen.Permission_PERMISSION_REPORT_TEMPLATES_DELETE: {ResourceReportTemplates, ActionDelete},

	gen.Permission_PERMISSION_IMPORT_SOURCES_READ:   {ResourceImportSources, ActionRead},
	gen.Permission_PERMISSION_IMPORT_SOURCES_CREATE: {ResourceImportSources, ActionCreate},
	gen.Permission_PERMISSION_IMPORT_SOURCES_UPDATE: {ResourceImportSources, ActionUpdate},

	gen.Permission_PERMISSION_USERS_READ:   {ResourceUsers, ActionRead},
	gen.Permission_PERMISSION_USERS_UPDATE: {ResourceUsers, ActionUpdate},

	gen.Permission_PERMISSION_GROUPS_READ:   {ResourceGroups, ActionRead},
	gen.Permission_PERMISSION_GROUPS_CREATE: {ResourceGroups, ActionCreate},
	gen.Permission_PERMISSION_GROUPS_UPDATE: {ResourceGroups, ActionUpdate},
	gen.Permission_PERMISSION_GROUPS_DELETE: {ResourceGroups, ActionDelete},

	gen.Permission_PERMISSION_SETTINGS_READ:   {ResourceSettings, ActionRead},
	gen.Permission_PERMISSION_SETTINGS_UPDATE: {ResourceSettings, ActionUpdate},

	gen.Permission_PERMISSION_ORGANIZATIONS_READ:    {ResourceOrganizations, ActionRead},
	gen.Permission_PERMISSION_ORGANIZATIONS_UPDATE:  {ResourceOrganizations, ActionUpdate},
	gen.Permission_PERMISSION_ORGANIZATIONS_ARCHIVE: {ResourceOrganizations, ActionArchive},
	gen.Permission_PERMISSION_ORGANIZATIONS_CREATE:  {ResourceOrganizations, ActionCreate},
	gen.Permission_PERMISSION_ORGANIZATIONS_DELETE:  {ResourceOrganizations, ActionDelete},

	gen.Permission_PERMISSION_REIMBURSEMENTS_READ:        {ResourceReimbursements, ActionRead},
	gen.Permission_PERMISSION_REIMBURSEMENTS_CREATE:      {ResourceReimbursements, ActionCreate},
	gen.Permission_PERMISSION_REIMBURSEMENTS_COMMENT:     {ResourceReimbursements, ActionComment},
	gen.Permission_PERMISSION_REIMBURSEMENTS_UPDATE:      {ResourceReimbursements, ActionUpdate},
	gen.Permission_PERMISSION_REIMBURSEMENTS_ARCHIVE:     {ResourceReimbursements, ActionArchive},
	gen.Permission_PERMISSION_REIMBURSEMENTS_READ_OWN:    {ResourceReimbursements, ActionReadOwn},
	gen.Permission_PERMISSION_REIMBURSEMENTS_COMMENT_OWN: {ResourceReimbursements, ActionCommentOwn},
	gen.Permission_PERMISSION_REIMBURSEMENTS_UPDATE_OWN:  {ResourceReimbursements, ActionUpdateOwn},
}

// GlobalDomain is the casbin domain value used for permissions that are not
// scoped to any organization (e.g. user management, group management, settings).
const GlobalDomain = ""

// GlobalResources lists resources whose permissions are system-wide rather
// than organization-scoped. Policies for these resources use GlobalDomain.
var GlobalResources = map[string]bool{
	ResourceUsers:         true,
	ResourceGroups:        true,
	ResourceSettings:      true,
	ResourceOrganizations: true,
}

// IsGlobalPermission reports whether the given proto permission is system-wide
// (not scoped to an organization).
func IsGlobalPermission(p gen.Permission) bool {
	perm, ok := Permissions[p]
	if !ok {
		return false
	}
	return GlobalResources[perm.Resource]
}

// PermissionFromProto converts a proto Permission to its casbin equivalent.
// Returns the zero value and false for PERMISSION_UNSPECIFIED.
func PermissionFromProto(p gen.Permission) (Permission, bool) {
	perm, ok := Permissions[p]
	return perm, ok
}

// ReversePermissions maps casbin resource+action back to the proto enum.
var ReversePermissions map[Permission]gen.Permission

func init() {
	ReversePermissions = make(map[Permission]gen.Permission, len(Permissions))
	for k, v := range Permissions {
		ReversePermissions[v] = k
	}
}
