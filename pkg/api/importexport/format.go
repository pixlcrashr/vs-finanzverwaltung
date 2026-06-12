package importexport

import "time"

// V1Version is the format version this package implements.
const V1Version = 1

// V1Document is the top-level import/export document (version 1).
type V1Document struct {
	// Version identifies the format version. Must be 1.
	Version int `json:"version"`
	// ExportedAt is the RFC 3339 timestamp of the export. Ignored on import.
	ExportedAt *time.Time `json:"exported_at,omitempty"`
	// Accounts contains all root accounts of the organisation. Child accounts are
	// embedded recursively in each account's Children field.
	Accounts []V1Account `json:"accounts"`
	// Budgets contains all budgets including their revisions and account values.
	Budgets []V1Budget `json:"budgets"`
}

// V1Account represents a single account node in the recursive tree.
type V1Account struct {
	// ID is a file-local UUID reference used to link children and account_values
	// within this document. It is never written to the database.
	ID string `json:"id"`
	// DisplayName is the human-readable name of the account.
	DisplayName string `json:"display_name"`
	// DisplayCode is the account number, e.g. "1", "1.1", "200".
	DisplayCode string `json:"display_code"`
	// DisplayDescription is an optional description. Empty string is treated as absent.
	DisplayDescription string `json:"display_description,omitempty"`
	// IsContainer indicates the account may only hold sub-accounts. Automatically
	// set to true when Children is non-empty.
	IsContainer bool `json:"is_container"`
	// IsArchived marks the account as archived.
	IsArchived bool `json:"is_archived"`
	// Children contains nested child accounts. The top-level Accounts list contains
	// only root accounts; all descendants are embedded here recursively.
	Children []V1Account `json:"children,omitempty"`
}

// V1Budget represents a budget with optional base account values and revisions.
type V1Budget struct {
	// ID is a file-local UUID reference. Never written to the database.
	ID string `json:"id"`
	// DisplayName is the human-readable name of the budget.
	DisplayName string `json:"display_name"`
	// DisplayDescription is an optional description.
	DisplayDescription string `json:"display_description,omitempty"`
	// PeriodStart is the start of the budget period (YYYY-MM-DD).
	PeriodStart string `json:"period_start"`
	// PeriodEnd is the end of the budget period (YYYY-MM-DD).
	PeriodEnd string `json:"period_end"`
	// IsClosed marks the budget as closed.
	IsClosed bool `json:"is_closed"`
	// AccountValues maps file-local account ID → decimal string value (base plan).
	// An absent or empty map means no base plan values.
	AccountValues map[string]string `json:"account_values,omitempty"`
	// Revisions lists the budget revisions in creation order (oldest first).
	Revisions []V1BudgetRevision `json:"revisions,omitempty"`
}

// V1BudgetRevision represents a single revision (amendment) of a budget.
type V1BudgetRevision struct {
	// ID is a file-local UUID reference. Never written to the database.
	ID string `json:"id"`
	// DisplayName is the optional human-readable name, e.g. "Nachtrag I".
	DisplayName string `json:"display_name,omitempty"`
	// DisplayDescription is an optional description.
	DisplayDescription string `json:"display_description,omitempty"`
	// Date is the revision date (YYYY-MM-DD).
	Date string `json:"date"`
	// AccountValues maps file-local account ID → decimal string value for this revision.
	AccountValues map[string]string `json:"account_values,omitempty"`
}
