package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
	gdate "google.golang.org/genproto/googleapis/type/date"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// resourceName helpers

func organizationName(id uuid.UUID) string { return fmt.Sprintf("organizations/%s", id) }
func accountName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/accounts/%s", orgID, id)
}
func accountGroupName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/accountGroups/%s", orgID, id)
}
func assignmentName(orgID, groupID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/accountGroups/%s/assignments/%s", orgID, groupID, id)
}
func budgetName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/budgets/%s", orgID, id)
}
func importSourceName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/importSources/%s", orgID, id)
}
func importSourcePeriodName(orgID, srcID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/importSources/%s/periods/%s", orgID, srcID, id)
}
func transactionName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/transactions/%s", orgID, id)
}
func transactionAccountName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/transactionAccounts/%s", orgID, id)
}
func txAssignmentName(orgID, txID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/transactions/%s/assignments/%s", orgID, txID, id)
}
func reportTemplateName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/reportTemplates/%s", orgID, id)
}
func reportName(orgID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/reports/%s", orgID, id)
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
		Name:        organizationName(m.ID),
		Uid:         m.ID.String(),
		DisplayName: m.DisplayName,
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// AccountToProto maps a model.Account to its proto representation.
func AccountToProto(m *model.Account) *gen.Account {
	p := &gen.Account{
		Name:               accountName(m.OrganizationID, m.ID),
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
		p.ParentAccount = accountName(m.OrganizationID, m.ParentAccountID.UUID)
	}
	return p
}

// NestedAccountToProto maps model.Account to gen.NestedAccount (without children; caller fills them).
func NestedAccountToProto(m *model.Account) *gen.NestedAccount {
	p := &gen.NestedAccount{
		Name:               accountName(m.OrganizationID, m.ID),
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
		p.ParentAccount = accountName(m.OrganizationID, m.ParentAccountID.UUID)
	}
	return p
}

// AccountGroupToProto maps a model.AccountGroup to its proto representation.
func AccountGroupToProto(m *model.AccountGroup) *gen.AccountGroup {
	return &gen.AccountGroup{
		Name:               accountGroupName(m.OrganizationID, m.ID),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// AccountGroupAssignmentToProto maps a model.AccountGroupAssignment to its proto representation.
func AccountGroupAssignmentToProto(m *model.AccountGroupAssignment) *gen.AccountGroupAssignment {
	return &gen.AccountGroupAssignment{
		Name:         assignmentName(m.OrganizationID, m.AccountGroupID, m.ID),
		Uid:          m.ID.String(),
		AccountGroup: accountGroupName(m.OrganizationID, m.AccountGroupID),
		AccountId:    m.AccountID.String(),
		Negate:       m.Negate,
		UpdateTime:   ts(m.UpdatedAt),
		CreateTime:   ts(m.CreatedAt),
	}
}

// BudgetToProto maps a model.Budget to its proto representation.
func BudgetToProto(m *model.Budget) *gen.Budget {
	return &gen.Budget{
		Name:               budgetName(m.OrganizationID, m.ID),
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

func budgetRevisionName(orgID, budgetID, revisionID uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/budgets/%s/revisions/%s", orgID, budgetID, revisionID)
}

func budgetRevisionAccountValueName(orgID, budgetID, revisionID, id uuid.UUID) string {
	return fmt.Sprintf("organizations/%s/budgets/%s/revisions/%s/accountValues/%s", orgID, budgetID, revisionID, id)
}

// BudgetRevisionToProto maps model.BudgetRevision to gen.BudgetRevision.
func BudgetRevisionToProto(m *model.BudgetRevision) *gen.BudgetRevision {
	return &gen.BudgetRevision{
		Name:               budgetRevisionName(m.OrganizationID, m.BudgetID, m.ID),
		Uid:                m.ID.String(),
		Budget:             budgetName(m.OrganizationID, m.BudgetID),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		Date:               dateProto(m.Date),
		CreateTime:         ts(m.CreatedAt),
	}
}

// BudgetRevisionAccountValueToProto maps model.BudgetRevisionAccountValue to gen.BudgetRevisionAccountValue.
func BudgetRevisionAccountValueToProto(m *model.BudgetRevisionAccountValue) *gen.BudgetRevisionAccountValue {
	return &gen.BudgetRevisionAccountValue{
		Name:       budgetRevisionAccountValueName(m.OrganizationID, m.BudgetRevision.BudgetID, m.BudgetTagID, m.ID),
		Uid:        m.ID.String(),
		Revision:   budgetRevisionName(m.OrganizationID, m.BudgetRevision.BudgetID, m.BudgetTagID),
		AccountId:  m.AccountID.String(),
		Value:      &gen.Decimal{Value: m.Value.String()},
		CreateTime: ts(m.CreatedAt),
	}
}

// ImportSourceToProto maps a model.ImportSource to its proto representation.
func ImportSourceToProto(m *model.ImportSource) *gen.ImportSource {
	return &gen.ImportSource{
		Name:               importSourceName(m.OrganizationID, m.ID),
		Uid:                m.ID.String(),
		DisplayName:        m.DisplayName,
		DisplayDescription: m.DisplayDescription,
		PeriodStart:        dateProto(m.PeriodStart),
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// ImportSourcePeriodToProto maps a model.ImportSourcePeriod to its proto representation.
func ImportSourcePeriodToProto(m *model.ImportSourcePeriod) *gen.ImportSourcePeriod {
	return &gen.ImportSourcePeriod{
		Name:         importSourcePeriodName(m.OrganizationID, m.ImportSourceID, m.ID),
		Uid:          m.ID.String(),
		ImportSource: importSourceName(m.OrganizationID, m.ImportSourceID),
		Year:         int32(m.Year),
		IsClosed:     m.IsClosed,
		UpdateTime:   ts(m.UpdatedAt),
		CreateTime:   ts(m.CreatedAt),
	}
}

// TransactionToProto maps a model.Transaction_ to its proto representation.
func TransactionToProto(m *model.Transaction_) *gen.Transaction {
	p := &gen.Transaction{
		Name:                       transactionName(m.OrganizationID, m.ID),
		Uid:                        m.ID.String(),
		CreditTransactionAccountId: m.CreditTransactionAccountID.String(),
		DebitTransactionAccountId:  m.DebitTransactionAccountID.String(),
		Amount:                     &gen.Decimal{Value: m.Amount.String()},
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
func TransactionAccountToProto(m *model.TransactionAccount) *gen.TransactionAccount {
	return &gen.TransactionAccount{
		Name:               transactionAccountName(m.OrganizationID, m.ID),
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
func TransactionAccountAssignmentToProto(m *model.TransactionAccountAssignment) *gen.TransactionAccountAssignment {
	return &gen.TransactionAccountAssignment{
		Name:        txAssignmentName(m.OrganizationID, m.TransactionID, m.ID),
		Uid:         m.ID.String(),
		Transaction: transactionName(m.OrganizationID, m.TransactionID),
		AccountId:   m.AccountID.String(),
		Value:       &gen.Decimal{Value: m.Value.String()},
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// ReportTemplateToProto maps a model.ReportTemplate to its proto representation.
func ReportTemplateToProto(m *model.ReportTemplate) *gen.ReportTemplate {
	return &gen.ReportTemplate{
		Name:        reportTemplateName(m.OrganizationID, m.ID),
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
func ReportToProto(m *model.Report) *gen.Report {
	return &gen.Report{
		Name:        reportName(m.OrganizationID, m.ID),
		Uid:         m.ID.String(),
		DisplayName: m.DisplayName,
		CreateTime:  ts(m.CreatedAt),
	}
}
