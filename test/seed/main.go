package main

import (
	"flag"
	"log"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/google/uuid"
	pkgdb "github.com/pixlcrashr/vsfv/pkg/db"
	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	dsn := flag.String("dsn", "postgres://vsf:postgres@127.0.0.1:5334/vsf?sslmode=disable", "PostgreSQL DSN")
	flag.Parse()

	db, err := pkgdb.Connect(*dsn)
	if err != nil {
		log.Fatalf("connect: %v", err)
	}
	db.Logger = db.Logger.LogMode(logger.Silent)

	if err := db.Transaction(func(tx *gorm.DB) error {
		return seed(tx)
	}); err != nil {
		log.Fatalf("seed: %v", err)
	}
	log.Println("seed complete")
}

func dec(s string) apd.Decimal {
	var d apd.Decimal
	if _, _, err := d.SetString(s); err != nil {
		log.Fatalf("invalid decimal %q: %v", s, err)
	}
	return d
}

func date(y int, m time.Month, d int) time.Time {
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

func cr(db *gorm.DB, v any) error { return db.Create(v).Error }

func seed(db *gorm.DB) error {
	// ── Organizations ────────────────────────────────────────────────────────
	org1 := &model.Organization{DisplayName: "Acme GmbH"}
	org2 := &model.Organization{DisplayName: "Beta AG"}
	if err := cr(db, org1); err != nil {
		return err
	}
	if err := cr(db, org2); err != nil {
		return err
	}

	// ── Account Groups ───────────────────────────────────────────────────────
	ag1 := &model.AccountGroup{OrganizationID: org1.ID, DisplayName: "Aktiva", DisplayDescription: "Vermögenswerte"}
	ag2 := &model.AccountGroup{OrganizationID: org1.ID, DisplayName: "Passiva", DisplayDescription: "Verbindlichkeiten"}
	ag3 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Erträge"}
	ag4 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Aufwendungen"}
	if err := cr(db, ag1); err != nil {
		return err
	}
	if err := cr(db, ag2); err != nil {
		return err
	}
	if err := cr(db, ag3); err != nil {
		return err
	}
	if err := cr(db, ag4); err != nil {
		return err
	}

	// ── Accounts ─────────────────────────────────────────────────────────────
	acc1 := &model.Account{OrganizationID: org1.ID, DisplayName: "Kasse", DisplayCode: "1000"}
	acc2 := &model.Account{OrganizationID: org1.ID, DisplayName: "Bank", DisplayCode: "1200"}
	acc3 := &model.Account{OrganizationID: org1.ID, DisplayName: "Umsatzerlöse", DisplayCode: "8000"}
	acc4 := &model.Account{OrganizationID: org2.ID, DisplayName: "Girokonto", DisplayCode: "1200"}
	acc5 := &model.Account{OrganizationID: org2.ID, DisplayName: "Materialaufwand", DisplayCode: "5000"}
	if err := cr(db, acc1); err != nil {
		return err
	}
	if err := cr(db, acc2); err != nil {
		return err
	}
	if err := cr(db, acc3); err != nil {
		return err
	}
	if err := cr(db, acc4); err != nil {
		return err
	}
	if err := cr(db, acc5); err != nil {
		return err
	}

	acc6 := &model.Account{
		OrganizationID:  org1.ID,
		ParentAccountID: uuid.NullUUID{Valid: true, UUID: acc1.ID},
		DisplayName:     "Handkasse",
		DisplayCode:     "1001",
	}
	if err := cr(db, acc6); err != nil {
		return err
	}

	// ── Account Group Assignments ────────────────────────────────────────────
	if err := cr(db, &model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag1.ID, AccountID: acc1.ID}); err != nil {
		return err
	}
	if err := cr(db, &model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag1.ID, AccountID: acc2.ID}); err != nil {
		return err
	}
	if err := cr(db, &model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag2.ID, AccountID: acc3.ID}); err != nil {
		return err
	}
	if err := cr(db, &model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag3.ID, AccountID: acc4.ID}); err != nil {
		return err
	}
	if err := cr(db, &model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag4.ID, AccountID: acc5.ID}); err != nil {
		return err
	}

	// ── Budgets ──────────────────────────────────────────────────────────────
	bud1 := &model.Budget{
		OrganizationID: org1.ID, DisplayName: "Budget 2024",
		PeriodStart: date(2024, 1, 1), PeriodEnd: date(2024, 12, 31),
	}
	bud2 := &model.Budget{
		OrganizationID: org1.ID, DisplayName: "Budget 2025",
		PeriodStart: date(2025, 1, 1), PeriodEnd: date(2025, 12, 31),
	}
	bud3 := &model.Budget{
		OrganizationID: org2.ID, DisplayName: "Jahresplan 2024",
		PeriodStart: date(2024, 1, 1), PeriodEnd: date(2024, 12, 31),
	}
	if err := cr(db, bud1); err != nil {
		return err
	}
	if err := cr(db, bud2); err != nil {
		return err
	}
	if err := cr(db, bud3); err != nil {
		return err
	}

	// ── Budget Account Values ────────────────────────────────────────────────
	if err := cr(db, &model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, AccountID: acc1.ID, Value: dec("5000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, AccountID: acc2.ID, Value: dec("20000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc1.ID, Value: dec("6000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc2.ID, Value: dec("25000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, AccountID: acc4.ID, Value: dec("15000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, AccountID: acc5.ID, Value: dec("8000")}); err != nil {
		return err
	}

	// ── Budget Revisions ─────────────────────────────────────────────────────
	rev1 := &model.BudgetRevision{
		OrganizationID: org1.ID, BudgetID: bud1.ID,
		DisplayName: "Q1 Snapshot", Date: date(2024, 3, 31),
	}
	rev2 := &model.BudgetRevision{
		OrganizationID: org1.ID, BudgetID: bud2.ID,
		DisplayName: "Q1 Snapshot", Date: date(2025, 3, 31),
	}
	rev3 := &model.BudgetRevision{
		OrganizationID: org2.ID, BudgetID: bud3.ID,
		DisplayName: "Mid-Year", Date: date(2024, 6, 30),
	}
	if err := cr(db, rev1); err != nil {
		return err
	}
	if err := cr(db, rev2); err != nil {
		return err
	}
	if err := cr(db, rev3); err != nil {
		return err
	}

	// ── Budget Revision Account Values ───────────────────────────────────────
	if err := cr(db, &model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetTagID: rev1.ID, AccountID: acc1.ID, Value: dec("5000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetTagID: rev1.ID, AccountID: acc2.ID, Value: dec("20000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetTagID: rev2.ID, AccountID: acc1.ID, Value: dec("6000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetTagID: rev2.ID, AccountID: acc2.ID, Value: dec("25000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetTagID: rev3.ID, AccountID: acc4.ID, Value: dec("15000")}); err != nil {
		return err
	}
	if err := cr(db, &model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetTagID: rev3.ID, AccountID: acc5.ID, Value: dec("8000")}); err != nil {
		return err
	}

	// ── Import Sources ───────────────────────────────────────────────────────
	src1 := &model.ImportSource{OrganizationID: org1.ID, DisplayName: "Datev Export", PeriodStart: date(2024, 1, 1)}
	src3 := &model.ImportSource{OrganizationID: org2.ID, DisplayName: "ERP Export", PeriodStart: date(2024, 1, 1)}
	if err := cr(db, src1); err != nil {
		return err
	}
	if err := cr(db, src3); err != nil {
		return err
	}

	// ── Import Source Periods ────────────────────────────────────────────────
	if err := cr(db, &model.ImportSourcePeriod{OrganizationID: org1.ID, ImportSourceID: src1.ID, Year: 2024}); err != nil {
		return err
	}
	if err := cr(db, &model.ImportSourcePeriod{OrganizationID: org2.ID, ImportSourceID: src3.ID, Year: 2026}); err != nil {
		return err
	}
	if err := cr(db, &model.ImportSourcePeriod{OrganizationID: org2.ID, ImportSourceID: src3.ID, Year: 2027}); err != nil {
		return err
	}

	// ── Transaction Accounts ─────────────────────────────────────────────────
	ta1 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "1000", DisplayName: "Kasse"}
	ta2 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "1200", DisplayName: "Bank"}
	ta3 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "8000", DisplayName: "Erlöse"}
	ta4 := &model.TransactionAccount{OrganizationID: org2.ID, ImportSourceID: src3.ID, Code: "1200", DisplayName: "Girokonto"}
	ta5 := &model.TransactionAccount{OrganizationID: org2.ID, ImportSourceID: src3.ID, Code: "5000", DisplayName: "Materialaufwand"}
	if err := cr(db, ta1); err != nil {
		return err
	}
	if err := cr(db, ta2); err != nil {
		return err
	}
	if err := cr(db, ta3); err != nil {
		return err
	}
	if err := cr(db, ta4); err != nil {
		return err
	}
	if err := cr(db, ta5); err != nil {
		return err
	}

	// ── Transactions ─────────────────────────────────────────────────────────
	tx1 := &model.Transaction_{
		OrganizationID:             org1.ID,
		CreditTransactionAccountID: ta3.ID,
		DebitTransactionAccountID:  ta2.ID,
		Amount:                     dec("1500"),
		Description:                "Verkauf Ware",
		Reference:                  "RE-2024-001",
		BookedAt:                   date(2024, 1, 15),
		DocumentDate:               date(2024, 1, 15),
	}
	tx2 := &model.Transaction_{
		OrganizationID:             org1.ID,
		CreditTransactionAccountID: ta2.ID,
		DebitTransactionAccountID:  ta1.ID,
		Amount:                     dec("500"),
		Description:                "Barabhebung",
		Reference:                  "BAR-2024-001",
		BookedAt:                   date(2024, 1, 20),
		DocumentDate:               date(2024, 1, 20),
	}
	tx3 := &model.Transaction_{
		OrganizationID:             org2.ID,
		CreditTransactionAccountID: ta5.ID,
		DebitTransactionAccountID:  ta4.ID,
		Amount:                     dec("3200"),
		Description:                "Materialeinkauf",
		Reference:                  "EK-2024-001",
		BookedAt:                   date(2024, 2, 1),
		DocumentDate:               date(2024, 2, 1),
	}
	tx4 := &model.Transaction_{
		OrganizationID:             org2.ID,
		CreditTransactionAccountID: ta4.ID,
		DebitTransactionAccountID:  ta5.ID,
		Amount:                     dec("800"),
		Description:                "Rückbuchung",
		Reference:                  "EK-2024-002",
		BookedAt:                   date(2024, 2, 5),
		DocumentDate:               date(2024, 2, 5),
	}
	if err := cr(db, tx1); err != nil {
		return err
	}
	if err := cr(db, tx2); err != nil {
		return err
	}
	if err := cr(db, tx3); err != nil {
		return err
	}
	if err := cr(db, tx4); err != nil {
		return err
	}

	// ── Transaction Account Assignments ──────────────────────────────────────
	if err := cr(db, &model.TransactionAccountAssignment{OrganizationID: org1.ID, TransactionID: tx1.ID, AccountID: acc3.ID, Value: dec("1500")}); err != nil {
		return err
	}
	if err := cr(db, &model.TransactionAccountAssignment{OrganizationID: org1.ID, TransactionID: tx2.ID, AccountID: acc1.ID, Value: dec("500")}); err != nil {
		return err
	}
	if err := cr(db, &model.TransactionAccountAssignment{OrganizationID: org2.ID, TransactionID: tx3.ID, AccountID: acc5.ID, Value: dec("3200")}); err != nil {
		return err
	}
	if err := cr(db, &model.TransactionAccountAssignment{OrganizationID: org2.ID, TransactionID: tx4.ID, AccountID: acc4.ID, Value: dec("800")}); err != nil {
		return err
	}

	// ── Report Templates ─────────────────────────────────────────────────────
	if err := cr(db, &model.ReportTemplate{OrganizationID: org1.ID, DisplayName: "Monatsbericht", Template: "# Monatsbericht"}); err != nil {
		return err
	}
	if err := cr(db, &model.ReportTemplate{OrganizationID: org1.ID, DisplayName: "Jahresbericht", Template: "# Jahresbericht"}); err != nil {
		return err
	}
	if err := cr(db, &model.ReportTemplate{OrganizationID: org2.ID, DisplayName: "Quartalsbericht", Template: "# Quartalsbericht"}); err != nil {
		return err
	}

	// ── Reports ──────────────────────────────────────────────────────────────
	if err := cr(db, &model.Report{OrganizationID: org1.ID, DisplayName: "Januar 2024", Data: []byte("Bericht Januar 2024")}); err != nil {
		return err
	}
	if err := cr(db, &model.Report{OrganizationID: org1.ID, DisplayName: "Februar 2024", Data: []byte("Bericht Februar 2024")}); err != nil {
		return err
	}
	if err := cr(db, &model.Report{OrganizationID: org2.ID, DisplayName: "Q1 2024", Data: []byte("Quartalsbericht Q1 2024")}); err != nil {
		return err
	}

	return nil
}
