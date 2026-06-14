package services

import (
	"strings"
	"time"

	"github.com/pixlcrashr/vsfv/pkg/db/model"
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

// ImportSourceToProto maps a model.ImportSource to its proto representation.
func ImportSourceToProto(organizationCustomID string, m *model.ImportSource) *gen.ImportSource {
	return &gen.ImportSource{
		Name:               gen.ImportSourceResourceName{Organization: organizationCustomID, ImportSource: m.CustomID}.String(),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		PeriodStart:        dateProto(m.PeriodStart),
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// ImportSourcePeriodToProto maps a model.ImportSourcePeriod to its proto representation.
func ImportSourcePeriodToProto(organizationCustomID, importSourceCustomID string, m *model.ImportSourcePeriod) *gen.ImportSourcePeriod {
	// Try to use preloaded ImportSource relation for CustomID
	return &gen.ImportSourcePeriod{
		Name:         gen.ImportSourcePeriodResourceName{Organization: organizationCustomID, ImportSource: importSourceCustomID, Period: m.CustomID}.String(),
		Uid:          m.ID.String(),
		ImportSource: gen.ImportSourceResourceName{Organization: organizationCustomID, ImportSource: importSourceCustomID}.String(),
		Year:         int32(m.Year),
		IsClosed:     m.IsClosed,
		UpdateTime:   ts(m.UpdatedAt),
		CreateTime:   ts(m.CreatedAt),
	}
}

// TransactionToProto maps a model.Transaction_ to its proto representation.
func TransactionToProto(organizationCustomID, transactionCustomID string, m *model.Transaction_) *gen.Transaction {
	p := &gen.Transaction{
		Name:                       gen.TransactionResourceName{Organization: organizationCustomID, Transaction: transactionCustomID}.String(),
		Uid:                        m.ID.String(),
		CreditTransactionAccountId: m.CreditTransactionAccountID.String(),
		DebitTransactionAccountId:  m.DebitTransactionAccountID.String(),
		Amount:                     &gen.Decimal{Value: decimalStr(m.Amount.String())},
		Description:                m.Description,
		Reference:                  m.Reference,
		BookedAt:                   ts(m.BookedAt),
		DocumentDate:               ts(m.DocumentDate),
		UpdateTime:                 ts(m.UpdatedAt),
		CreateTime:                 ts(m.CreatedAt),
	}
	return p
}

// TransactionAccountToProto maps a model.TransactionAccount to its proto representation.
func TransactionAccountToProto(organizationCustomID, transactionAccountCustomID string, m *model.TransactionAccount) *gen.TransactionAccount {
	return &gen.TransactionAccount{
		Name:               gen.TransactionAccountResourceName{Organization: organizationCustomID, TransactionAccount: transactionAccountCustomID}.String(),
		Uid:                m.ID.String(),
		Code:               m.Code,
		ImportSourceId:     m.ImportSourceID.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// TransactionAccountAssignmentToProto maps a model.TransactionAccountAssignment to its proto representation.
func TransactionAccountAssignmentToProto(organizationCustomID, transactionCustomID, assignmentCustomID string, m *model.TransactionAccountAssignment) *gen.TransactionAccountAssignment {
	return &gen.TransactionAccountAssignment{
		Name:        gen.TransactionAccountAssignmentResourceName{Organization: organizationCustomID, Transaction: transactionCustomID, Assignment: assignmentCustomID}.String(),
		Uid:         m.ID.String(),
		Transaction: gen.TransactionResourceName{Organization: organizationCustomID, Transaction: transactionCustomID}.String(),
		AccountId:   m.AccountID.String(),
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
