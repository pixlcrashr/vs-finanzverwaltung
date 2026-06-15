package services

import (
	"strings"
	"time"

	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	gdate "google.golang.org/genproto/googleapis/type/date"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func decimalStr(s string) string {
	if strings.Contains(s, ".") {
		s = strings.TrimRight(s, "0")
		s = strings.TrimRight(s, ".")
	}
	return s
}

// ts converts time.Time → *timestamppb.Timestamp.
func ts(t time.Time) *timestamppb.Timestamp { return timestamppb.New(t) }

// dateProto converts time.Time → *google.type.Date (year/month/day only).
func dateProto(t time.Time) *gdate.Date {
	return &gdate.Date{
		Year:  int32(t.Year()),
		Month: int32(t.Month()),
		Day:   int32(t.Day()),
	}
}

// protoDateToTime converts *google.type.Date → time.Time (UTC midnight).
func protoDateToTime(d *gdate.Date) time.Time {
	if d == nil {
		return time.Time{}
	}
	return time.Date(int(d.Year), time.Month(d.Month), int(d.Day), 0, 0, 0, 0, time.UTC)
}

// OrganizationToProto maps a model.Organization to its proto representation.
func OrganizationToProto(m *model.Organization) *gen.Organization {
	return &gen.Organization{
		Name:        gen.OrganizationResourceName{Organization: m.CustomID}.String(),
		Uid:         m.ID.String(),
		DisplayName: m.DisplayName,
		StartMonth:  gen.Month(m.StartMonth),
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// AccountToProto maps a model.Account to its proto representation.
func AccountToProto(organizationCustomID string, m *model.Account) *gen.Account {
	p := &gen.Account{
		Name:               gen.AccountResourceName{Organization: organizationCustomID, Account: m.CustomID}.String(),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayCode:        m.DisplayCode,
		DisplayDescription: m.DisplayDescription,
		IsContainer:        m.IsContainer,
		IsArchived:         m.IsArchived,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
	if m.ParentAccountID.Valid {
		parent := m.ParentAccount
		if parent == nil {
			// If ParentAccount is not loaded, we can't construct the name.
			// This should be rare; caller should ensure ParentAccount is preloaded
			// or use the ID-based lookup as fallback for now.
			p.ParentAccount = ""
		} else {
			p.ParentAccount = gen.AccountResourceName{Organization: organizationCustomID, Account: parent.CustomID}.String()
		}
	}
	return p
}

// NestedAccountToProto maps model.Account to gen.NestedAccount (without children; caller fills them).
func NestedAccountToProto(organizationCustomID string, m *model.Account) *gen.NestedAccount {
	p := &gen.NestedAccount{
		Name:               gen.AccountResourceName{Organization: organizationCustomID, Account: m.CustomID}.String(),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayCode:        m.DisplayCode,
		DisplayDescription: m.DisplayDescription,
		IsContainer:        m.IsContainer,
		IsArchived:         m.IsArchived,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
	if m.ParentAccountID.Valid {
		parent := m.ParentAccount
		if parent == nil {
			p.ParentAccount = ""
		} else {
			p.ParentAccount = gen.AccountResourceName{Organization: organizationCustomID, Account: parent.CustomID}.String()
		}
	}
	return p
}

// AccountGroupToProto maps a model.AccountGroup to its proto representation.
func AccountGroupToProto(organizationCustomID string, m *model.AccountGroup) *gen.AccountGroup {
	return &gen.AccountGroup{
		Name:               gen.AccountGroupResourceName{Organization: organizationCustomID, AccountGroup: m.CustomID}.String(),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// AccountGroupAssignmentToProto maps a model.AccountGroupAssignment to its proto representation.
func AccountGroupAssignmentToProto(organizationCustomID string, accountGroupCustomID string, m *model.AccountGroupAssignment) *gen.AccountGroupAssignment {
	return &gen.AccountGroupAssignment{
		Name:         gen.AccountGroupAssignmentResourceName{Organization: organizationCustomID, AccountGroup: accountGroupCustomID, Assignment: m.CustomID}.String(),
		Uid:          m.ID.String(),
		AccountGroup: gen.AccountGroupResourceName{Organization: organizationCustomID, AccountGroup: accountGroupCustomID}.String(),
		AccountId:    m.AccountID.String(),
		Negate:       m.Negate,
		UpdateTime:   ts(m.UpdatedAt),
		CreateTime:   ts(m.CreatedAt),
	}
}

// BudgetToProto maps a model.Budget to its proto representation.
func BudgetToProto(organizationCustomID string, m *model.Budget) *gen.Budget {
	return &gen.Budget{
		Name:               gen.BudgetResourceName{Organization: organizationCustomID, Budget: m.CustomID}.String(),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		IsClosed:           m.IsClosed,
		PeriodStart:        dateProto(m.PeriodStart),
		PeriodEnd:          dateProto(m.PeriodEnd),
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// BudgetAccountValueToProto maps model.BudgetAccountValue to gen.BudgetAccountValue.
func BudgetAccountValueToProto(organizationCustomID, budgetCustomID string, m *model.BudgetAccountValue) *gen.BudgetAccountValue {
	return &gen.BudgetAccountValue{
		Name:       gen.BudgetAccountValueResourceName{Organization: organizationCustomID, Budget: budgetCustomID, AccountValue: m.CustomID}.String(),
		Uid:        m.ID.String(),
		Budget:     gen.BudgetResourceName{Organization: organizationCustomID, Budget: budgetCustomID}.String(),
		AccountId:  m.AccountID.String(),
		Value:      &gen.Decimal{Value: decimalStr(m.Value.String())},
		UpdateTime: ts(m.UpdatedAt),
		CreateTime: ts(m.CreatedAt),
	}
}

// BudgetRevisionToProto maps model.BudgetRevision to gen.BudgetRevision.
func BudgetRevisionToProto(organizationCustomID, budgetCustomID string, m *model.BudgetRevision) *gen.BudgetRevision {
	return &gen.BudgetRevision{
		Name:               gen.BudgetRevisionResourceName{Organization: organizationCustomID, Budget: budgetCustomID, Revision: m.CustomID}.String(),
		Uid:                m.ID.String(),
		Budget:             gen.BudgetResourceName{Organization: organizationCustomID, Budget: budgetCustomID}.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		Date:               dateProto(m.Date),
		CreateTime:         ts(m.CreatedAt),
	}
}

// BudgetRevisionAccountValueToProto maps model.BudgetRevisionAccountValue to gen.BudgetRevisionAccountValue.
func BudgetRevisionAccountValueToProto(organizationCustomID, budgetCustomID, revisionCustomID string, m *model.BudgetRevisionAccountValue) *gen.BudgetRevisionAccountValue {
	return &gen.BudgetRevisionAccountValue{
		Name:       gen.BudgetRevisionAccountValueResourceName{Organization: organizationCustomID, Budget: budgetCustomID, Revision: revisionCustomID, AccountValue: m.CustomID}.String(),
		Uid:        m.ID.String(),
		Revision:   gen.BudgetRevisionResourceName{Organization: organizationCustomID, Budget: budgetCustomID, Revision: revisionCustomID}.String(),
		AccountId:  m.AccountID.String(),
		Value:      &gen.Decimal{Value: decimalStr(m.Value.String())},
		CreateTime: ts(m.CreatedAt),
	}
}

// LedgerYearToProto maps a model.LedgerYear to its proto representation.
func LedgerYearToProto(organizationCustomID, ledgerYearCustomID string, m *model.LedgerYear) *gen.LedgerYear {
	return &gen.LedgerYear{
		Name:       gen.LedgerYearResourceName{Organization: organizationCustomID, LedgerYear: ledgerYearCustomID}.String(),
		Uid:        m.ID.String(),
		Year:       int32(m.Year),
		IsClosed:   m.IsClosed,
		UpdateTime: ts(m.UpdatedAt),
		CreateTime: ts(m.CreatedAt),
	}
}

// TransactionToProto maps a model.Transaction_ to its proto representation.
func TransactionToProto(organizationCustomID, transactionCustomID string, m *model.Transaction_) *gen.Transaction {
	p := &gen.Transaction{
		Name:                gen.TransactionResourceName{Organization: organizationCustomID, Transaction: transactionCustomID}.String(),
		Uid:                 m.ID.String(),
		CreditLedgerAccount: gen.LedgerAccountResourceName{Organization: organizationCustomID, LedgerAccount: m.CreditLedgerAccountID.String()}.String(),
		DebitLedgerAccount:  gen.LedgerAccountResourceName{Organization: organizationCustomID, LedgerAccount: m.DebitLedgerAccountID.String()}.String(),
		Amount:              &gen.Decimal{Value: decimalStr(m.Amount.String())},
		Description:         m.Description,
		Reference:           m.Reference,
		BookedAt:            ts(m.BookedAt),
		DocumentDate:        ts(m.DocumentDate),
		UpdateTime:          ts(m.UpdatedAt),
		CreateTime:          ts(m.CreatedAt),
	}
	return p
}

// LedgerAccountToProto maps a model.LedgerAccount to its proto representation.
func LedgerAccountToProto(organizationCustomID, ledgerAccountCustomID string, m *model.LedgerAccount) *gen.LedgerAccount {
	return &gen.LedgerAccount{
		Name:               gen.LedgerAccountResourceName{Organization: organizationCustomID, LedgerAccount: ledgerAccountCustomID}.String(),
		Uid:                m.ID.String(),
		Code:               m.Code,
		AccountType:        gen.AccountType(m.AccountType),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// TransactionAssignmentToProto maps a model.TransactionAssignment to its proto representation.
func TransactionAssignmentToProto(organizationCustomID, transactionCustomID, accountCustomID string, m *model.TransactionAssignment) *gen.TransactionAssignment {
	return &gen.TransactionAssignment{
		Name:        gen.TransactionAssignmentResourceName{Organization: organizationCustomID, Transaction: transactionCustomID, Assignment: m.ID.String()}.String(),
		Uid:         m.ID.String(),
		Transaction: gen.TransactionResourceName{Organization: organizationCustomID, Transaction: transactionCustomID}.String(),
		Account:     gen.AccountResourceName{Organization: organizationCustomID, Account: accountCustomID}.String(),
		Value:       &gen.Decimal{Value: decimalStr(m.Value.String())},
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// ReportTemplateToProto maps a model.ReportTemplate to its proto representation.
func ReportTemplateToProto(organizationCustomID, reportTemplateCustomID string, m *model.ReportTemplate) *gen.ReportTemplate {
	return &gen.ReportTemplate{
		Name:        gen.ReportTemplateResourceName{Organization: organizationCustomID, ReportTemplate: reportTemplateCustomID}.String(),
		Uid:         m.ID.String(),
		DisplayName: m.DisplayName,
		Template:    m.Template,
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// ReportToProto maps a model.Report to its proto representation.
// Note: model.Report does not persist the template ID after generation;
// report_template_id is intentionally left empty here.
func ReportToProto(organizationCustomID, reportCustomID string, m *model.Report) *gen.Report {
	return &gen.Report{
		Name:        gen.ReportResourceName{Organization: organizationCustomID, Report: reportCustomID}.String(),
		Uid:         m.ID.String(),
		DisplayName: m.DisplayName,
		CreateTime:  ts(m.CreatedAt),
	}
}

// UserToProto maps a model.User to its proto representation.
func UserToProto(m *model.User) *gen.User {
	return &gen.User{
		Name:        gen.UserResourceName{User: m.ID.String()}.String(),
		Uid:         m.ID.String(),
		DisplayName: m.Name,
		Email:       m.Email,
		IsActive:    true,
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// UserIdentityToProto maps a model.UserIdentity to its proto representation.
func UserIdentityToProto(userID string, m *model.UserIdentity) *gen.UserIdentity {
	return &gen.UserIdentity{
		Name:            gen.UserIdentityResourceName{User: userID, Identity: m.CustomID}.String(),
		Uid:             m.ID.String(),
		Provider:        m.Provider,
		ProviderSubject: m.ProviderUserID,
		DisplayName:     "",
		Email:           "",
		CreateTime:      ts(m.CreatedAt),
	}
}

// UserSettingsToProto maps a model.UserSettings to its proto representation.
func UserSettingsToProto(userID string, m *model.UserSettings) *gen.UserSettings {
	return &gen.UserSettings{
		Name:       gen.UserSettingsResourceName{User: userID}.String(),
		Locale:     m.Locale,
		Theme:      m.Theme,
		UpdateTime: ts(m.UpdatedAt),
	}
}

// UserGroupToProto maps a model.UserGroup to its proto representation.
func UserGroupToProto(m *model.UserGroup, policies []*gen.GroupOrganizationPolicy) *gen.Group {
	return &gen.Group{
		Name:                 gen.GroupResourceName{Group: m.CustomID}.String(),
		Uid:                  m.ID.String(),
		DisplayName:          m.Name,
		DisplayDescription:   m.Description,
		OrganizationPolicies: policies,
		UpdateTime:           ts(m.UpdatedAt),
		CreateTime:           ts(m.CreatedAt),
	}
}

// BudgetActualAccountValueToProto maps a computed ActualAccountValue to its
// proto representation.
func BudgetActualAccountValueToProto(organizationCustomID, budgetCustomID string, m *repository.ActualAccountValue) *gen.BudgetActualAccountValue {
	return &gen.BudgetActualAccountValue{
		Name:    gen.BudgetActualAccountValueResourceName{Organization: organizationCustomID, Budget: budgetCustomID, Account: m.AccountCustomID}.String(),
		Account: gen.AccountResourceName{Organization: organizationCustomID, Account: m.AccountCustomID}.String(),
		Budget:  gen.BudgetResourceName{Organization: organizationCustomID, Budget: budgetCustomID}.String(),
		Value:   &gen.Decimal{Value: decimalStr(m.Value.String())},
	}
}
