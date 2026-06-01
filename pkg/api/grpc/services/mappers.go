package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	gen "github.com/pixlcrashr/vsfv/pkg/api/grpc/gen"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	gdate "google.golang.org/genproto/googleapis/type/date"
	"google.golang.org/protobuf/types/known/timestamppb"
)

// resourceName helpers

func accountName(id uuid.UUID) string      { return fmt.Sprintf("accounts/%s", id) }
func accountGroupName(id uuid.UUID) string { return fmt.Sprintf("accountGroups/%s", id) }
func assignmentName(groupID, id uuid.UUID) string {
	return fmt.Sprintf("accountGroups/%s/assignments/%s", groupID, id)
}
func budgetName(id uuid.UUID) string       { return fmt.Sprintf("budgets/%s", id) }
func importSourceName(id uuid.UUID) string { return fmt.Sprintf("importSources/%s", id) }
func importSourcePeriodName(srcID, id uuid.UUID) string {
	return fmt.Sprintf("importSources/%s/periods/%s", srcID, id)
}
func transactionName(id uuid.UUID) string { return fmt.Sprintf("transactions/%s", id) }
func transactionAccountName(id uuid.UUID) string {
	return fmt.Sprintf("transactionAccounts/%s", id)
}
func txAssignmentName(txID, id uuid.UUID) string {
	return fmt.Sprintf("transactions/%s/assignments/%s", txID, id)
}
func reportTemplateName(id uuid.UUID) string { return fmt.Sprintf("reportTemplates/%s", id) }
func reportName(id uuid.UUID) string         { return fmt.Sprintf("reports/%s", id) }

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

// AccountToProto maps a model.Account to its proto representation.
func AccountToProto(m *model.Account) *gen.Account {
	p := &gen.Account{
		Name:               accountName(m.ID),
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
		p.ParentAccount = accountName(m.ParentAccountID.UUID)
	}
	return p
}

// NestedAccountToProto maps model.Account to gen.NestedAccount (without children; caller fills them).
func NestedAccountToProto(m *model.Account) *gen.NestedAccount {
	p := &gen.NestedAccount{
		Name:               accountName(m.ID),
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
		p.ParentAccount = accountName(m.ParentAccountID.UUID)
	}
	return p
}

// AccountGroupToProto maps a model.AccountGroup to its proto representation.
func AccountGroupToProto(m *model.AccountGroup) *gen.AccountGroup {
	return &gen.AccountGroup{
		Name:               accountGroupName(m.ID),
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
		Name:         assignmentName(m.AccountGroupID, m.ID),
		Uid:          m.ID.String(),
		AccountGroup: accountGroupName(m.AccountGroupID),
		AccountId:    m.AccountID.String(),
		Negate:       m.Negate,
		UpdateTime:   ts(m.UpdatedAt),
		CreateTime:   ts(m.CreatedAt),
	}
}

// BudgetToProto maps a model.Budget to its proto representation.
func BudgetToProto(m *model.Budget) *gen.Budget {
	return &gen.Budget{
		Name:               budgetName(m.ID),
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

// BudgetRevisionToTagProto maps model.BudgetRevision to the gen.BudgetTag proto.
// The proto resource name is budgets/{budget}/tags/{revision}.
func BudgetTagToProto(m *model.BudgetTag) *gen.BudgetTag {
	return &gen.BudgetTag{
		Name:               fmt.Sprintf("budgets/%s/tags/%s", m.BudgetID, m.ID),
		Uid:                m.ID.String(),
		Budget:             budgetName(m.BudgetID),
		Date:               dateProto(m.Date),
		DisplayDescription: m.DisplayDescription,
		UpdateTime:         ts(m.UpdatedAt),
		CreateTime:         ts(m.CreatedAt),
	}
}

// ImportSourceToProto maps a model.ImportSource to its proto representation.
func ImportSourceToProto(m *model.ImportSource) *gen.ImportSource {
	return &gen.ImportSource{
		Name:               importSourceName(m.ID),
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
		Name:         importSourcePeriodName(m.ImportSourceID, m.ID),
		Uid:          m.ID.String(),
		ImportSource: importSourceName(m.ImportSourceID),
		Year:         int32(m.Year),
		IsClosed:     m.IsClosed,
		UpdateTime:   ts(m.UpdatedAt),
		CreateTime:   ts(m.CreatedAt),
	}
}

// TransactionToProto maps a model.Transaction_ to its proto representation.
func TransactionToProto(m *model.Transaction_) *gen.Transaction {
	p := &gen.Transaction{
		Name:                       transactionName(m.ID),
		Uid:                        m.ID.String(),
		CreditTransactionAccountId: m.CreditTransactionAccountID.String(),
		DebitTransactionAccountId:  m.DebitTransactionAccountID.String(),
		Amount:                     m.Amount.String(),
		Description:                m.Description,
		Reference:                  m.Reference,
		BookedAt:                   ts(m.BookedAt),
		DocumentDate:               ts(m.DocumentDate),
		UpdateTime:                 ts(m.UpdatedAt),
		CreateTime:                 ts(m.CreatedAt),
	}
	if m.AssignedAccountID.Valid {
		p.AssignedAccountId = m.AssignedAccountID.UUID.String()
	}
	return p
}

// TransactionAccountToProto maps a model.TransactionAccount to its proto representation.
func TransactionAccountToProto(m *model.TransactionAccount) *gen.TransactionAccount {
	return &gen.TransactionAccount{
		Name:               transactionAccountName(m.ID),
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
		Name:        txAssignmentName(m.TransactionID, m.ID),
		Uid:         m.ID.String(),
		Transaction: transactionName(m.TransactionID),
		AccountId:   m.AccountID.String(),
		Value:       m.Value.String(),
		UpdateTime:  ts(m.UpdatedAt),
		CreateTime:  ts(m.CreatedAt),
	}
}

// ReportTemplateToProto maps a model.ReportTemplate to its proto representation.
func ReportTemplateToProto(m *model.ReportTemplate) *gen.ReportTemplate {
	return &gen.ReportTemplate{
		Name:        reportTemplateName(m.ID),
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
		Name:        reportName(m.ID),
		Uid:         m.ID.String(),
		DisplayName: m.DisplayName,
		CreateTime:  ts(m.CreatedAt),
	}
}
