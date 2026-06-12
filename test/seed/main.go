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
	// org1: Verein Musterstadt – a registered association (Verein), focuses on
	//       membership fees, event income, and operating expenses.
	// org2: Handwerk Süd GmbH – a small craft company, focuses on materials,
	//       wages, and customer invoices.
	org1 := &model.Organization{DisplayName: "Verein Musterstadt e.V."}
	org2 := &model.Organization{DisplayName: "Handwerk Süd GmbH"}
	if err := cr(db, org1); err != nil {
		return err
	}
	if err := cr(db, org2); err != nil {
		return err
	}

	// ── Account Groups ───────────────────────────────────────────────────────
	// org1: association chart of accounts
	ag1 := &model.AccountGroup{OrganizationID: org1.ID, DisplayName: "Umlaufvermögen", DisplayDescription: "Kasse, Bank und kurzfristige Forderungen"}
	ag2 := &model.AccountGroup{OrganizationID: org1.ID, DisplayName: "Vereinseinnahmen", DisplayDescription: "Mitgliedsbeiträge und Veranstaltungserlöse"}
	ag3 := &model.AccountGroup{OrganizationID: org1.ID, DisplayName: "Vereinsausgaben", DisplayDescription: "Betriebskosten des Vereins"}
	// org2: craft-company chart of accounts
	ag4 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Anlagevermögen", DisplayDescription: "Maschinen und Fahrzeuge"}
	ag5 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Umsatzerlöse", DisplayDescription: "Erlöse aus Kundenaufträgen"}
	ag6 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Materialkosten", DisplayDescription: "Roh-, Hilfs- und Betriebsstoffe"}
	ag7 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Personalkosten", DisplayDescription: "Löhne und Gehälter"}
	ag8 := &model.AccountGroup{OrganizationID: org2.ID, DisplayName: "Liquidität", DisplayDescription: "Bankkonten und Kasse"}
	for _, v := range []any{ag1, ag2, ag3, ag4, ag5, ag6, ag7, ag8} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Accounts ─────────────────────────────────────────────────────────────
	// org1 accounts
	acc1 := &model.Account{OrganizationID: org1.ID, DisplayName: "Kasse", DisplayCode: "1000", DisplayDescription: "Barkasse des Vereins"}
	acc2 := &model.Account{OrganizationID: org1.ID, DisplayName: "Girokonto", DisplayCode: "1200", DisplayDescription: "Hauptbankkonto"}
	acc3 := &model.Account{OrganizationID: org1.ID, DisplayName: "Mitgliedsbeiträge", DisplayCode: "4000", DisplayDescription: "Jährliche Mitgliedsbeiträge"}
	acc4 := &model.Account{OrganizationID: org1.ID, DisplayName: "Veranstaltungserlöse", DisplayCode: "4100", DisplayDescription: "Einnahmen aus Vereinsveranstaltungen"}
	acc5 := &model.Account{OrganizationID: org1.ID, DisplayName: "Raummiete", DisplayCode: "6000", DisplayDescription: "Miete für Vereinsräume"}
	acc6 := &model.Account{OrganizationID: org1.ID, DisplayName: "Bürobedarf", DisplayCode: "6100", DisplayDescription: "Büromaterial und Druckkosten"}
	// org2 accounts
	acc7 := &model.Account{OrganizationID: org2.ID, DisplayName: "Geschäftskonto", DisplayCode: "1210", DisplayDescription: "Hauptgeschäftskonto"}
	acc8 := &model.Account{OrganizationID: org2.ID, DisplayName: "Maschinen", DisplayCode: "0200", DisplayDescription: "Produktionsmaschinen"}
	acc9 := &model.Account{OrganizationID: org2.ID, DisplayName: "Fahrzeuge", DisplayCode: "0300", DisplayDescription: "Firmenfahrzeuge"}
	acc10 := &model.Account{OrganizationID: org2.ID, DisplayName: "Erlöse Aufträge", DisplayCode: "8000", DisplayDescription: "Erlöse aus Handwerkeraufträgen"}
	acc11 := &model.Account{OrganizationID: org2.ID, DisplayName: "Materialaufwand", DisplayCode: "5000", DisplayDescription: "Verbrauchtes Rohmaterial"}
	acc12 := &model.Account{OrganizationID: org2.ID, DisplayName: "Löhne und Gehälter", DisplayCode: "6200", DisplayDescription: "Bruttogehälter der Mitarbeiter"}
	for _, v := range []any{acc1, acc2, acc3, acc4, acc5, acc6, acc7, acc8, acc9, acc10, acc11, acc12} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// sub-accounts
	acc1a := &model.Account{
		OrganizationID:  org1.ID,
		ParentAccountID: uuid.NullUUID{Valid: true, UUID: acc1.ID},
		DisplayName:     "Handkasse",
		DisplayCode:     "1001",
	}
	acc8a := &model.Account{
		OrganizationID:  org2.ID,
		ParentAccountID: uuid.NullUUID{Valid: true, UUID: acc8.ID},
		DisplayName:     "Fräsmaschine",
		DisplayCode:     "0201",
	}
	for _, v := range []any{acc1a, acc8a} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Account Group Assignments ────────────────────────────────────────────
	// org1
	for _, v := range []any{
		&model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag1.ID, AccountID: acc1.ID},
		&model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag1.ID, AccountID: acc2.ID},
		&model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag2.ID, AccountID: acc3.ID},
		&model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag2.ID, AccountID: acc4.ID},
		&model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag3.ID, AccountID: acc5.ID},
		&model.AccountGroupAssignment{OrganizationID: org1.ID, AccountGroupID: ag3.ID, AccountID: acc6.ID},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}
	// org2
	for _, v := range []any{
		&model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag4.ID, AccountID: acc8.ID},
		&model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag4.ID, AccountID: acc9.ID},
		&model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag5.ID, AccountID: acc10.ID},
		&model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag6.ID, AccountID: acc11.ID},
		&model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag7.ID, AccountID: acc12.ID},
		&model.AccountGroupAssignment{OrganizationID: org2.ID, AccountGroupID: ag8.ID, AccountID: acc7.ID},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Budgets ──────────────────────────────────────────────────────────────
	// org1: two yearly budgets, the 2024 one is closed
	bud1 := &model.Budget{
		OrganizationID: org1.ID, DisplayName: "Vereinshaushalt 2024",
		PeriodStart: date(2024, 1, 1), PeriodEnd: date(2024, 12, 31), IsClosed: true,
	}
	bud2 := &model.Budget{
		OrganizationID: org1.ID, DisplayName: "Vereinshaushalt 2025",
		PeriodStart: date(2025, 1, 1), PeriodEnd: date(2025, 12, 31),
	}
	// org2: quarterly budgets
	bud3 := &model.Budget{
		OrganizationID: org2.ID, DisplayName: "Betriebsplan Q1 2025",
		PeriodStart: date(2025, 1, 1), PeriodEnd: date(2025, 3, 31),
	}
	bud4 := &model.Budget{
		OrganizationID: org2.ID, DisplayName: "Betriebsplan Q2 2025",
		PeriodStart: date(2025, 4, 1), PeriodEnd: date(2025, 6, 30),
	}
	for _, v := range []any{bud1, bud2, bud3, bud4} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Budget Account Values ────────────────────────────────────────────────
	for _, v := range []any{
		// org1 – bud1 (2024, closed)
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, AccountID: acc1.ID, Value: dec("2000")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, AccountID: acc2.ID, Value: dec("8000")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, AccountID: acc3.ID, Value: dec("12000")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, AccountID: acc5.ID, Value: dec("3600")},
		// org1 – bud2 (2025)
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc1.ID, Value: dec("2500")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc2.ID, Value: dec("10000")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc3.ID, Value: dec("13500")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc4.ID, Value: dec("5000")},
		&model.BudgetAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, AccountID: acc5.ID, Value: dec("4200")},
		// org2 – bud3 (Q1 2025)
		&model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, AccountID: acc10.ID, Value: dec("45000")},
		&model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, AccountID: acc11.ID, Value: dec("18000")},
		&model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, AccountID: acc12.ID, Value: dec("22000")},
		// org2 – bud4 (Q2 2025)
		&model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud4.ID, AccountID: acc10.ID, Value: dec("52000")},
		&model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud4.ID, AccountID: acc11.ID, Value: dec("20000")},
		&model.BudgetAccountValue{OrganizationID: org2.ID, BudgetID: bud4.ID, AccountID: acc12.ID, Value: dec("23000")},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Budget Revisions ─────────────────────────────────────────────────────
	rev1 := &model.BudgetRevision{
		OrganizationID: org1.ID, BudgetID: bud1.ID,
		DisplayName: "Jahresabschluss 2024", Date: date(2024, 12, 31),
	}
	rev2 := &model.BudgetRevision{
		OrganizationID: org1.ID, BudgetID: bud2.ID,
		DisplayName: "Halbjahresstand", Date: date(2025, 6, 30),
	}
	rev3 := &model.BudgetRevision{
		OrganizationID: org2.ID, BudgetID: bud3.ID,
		DisplayName: "Q1 Abschluss", Date: date(2025, 3, 31),
	}
	rev4 := &model.BudgetRevision{
		OrganizationID: org2.ID, BudgetID: bud4.ID,
		DisplayName: "Q2 Vorschau", Date: date(2025, 4, 15),
	}
	for _, v := range []any{rev1, rev2, rev3, rev4} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Budget Revision Account Values ───────────────────────────────────────
	for _, v := range []any{
		&model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, BudgetRevisionID: rev1.ID, AccountID: acc1.ID, Value: dec("1850")},
		&model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, BudgetRevisionID: rev1.ID, AccountID: acc2.ID, Value: dec("7600")},
		&model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetID: bud1.ID, BudgetRevisionID: rev1.ID, AccountID: acc3.ID, Value: dec("11800")},
		&model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, BudgetRevisionID: rev2.ID, AccountID: acc1.ID, Value: dec("2500")},
		&model.BudgetRevisionAccountValue{OrganizationID: org1.ID, BudgetID: bud2.ID, BudgetRevisionID: rev2.ID, AccountID: acc3.ID, Value: dec("7200")},
		&model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, BudgetRevisionID: rev3.ID, AccountID: acc10.ID, Value: dec("43500")},
		&model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, BudgetRevisionID: rev3.ID, AccountID: acc11.ID, Value: dec("17200")},
		&model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetID: bud3.ID, BudgetRevisionID: rev3.ID, AccountID: acc12.ID, Value: dec("21500")},
		&model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetID: bud4.ID, BudgetRevisionID: rev4.ID, AccountID: acc10.ID, Value: dec("50000")},
		&model.BudgetRevisionAccountValue{OrganizationID: org2.ID, BudgetID: bud4.ID, BudgetRevisionID: rev4.ID, AccountID: acc11.ID, Value: dec("19500")},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Import Sources ───────────────────────────────────────────────────────
	src1 := &model.ImportSource{OrganizationID: org1.ID, DisplayName: "Volksbank CSV 2024", DisplayDescription: "Kontoauszug Volksbank", PeriodStart: date(2024, 1, 1)}
	src2 := &model.ImportSource{OrganizationID: org1.ID, DisplayName: "Kasse 2025", DisplayDescription: "Kassenbuch", PeriodStart: date(2025, 1, 1)}
	src3 := &model.ImportSource{OrganizationID: org2.ID, DisplayName: "Datev Export 2025", DisplayDescription: "DATEV-Buchungsexport", PeriodStart: date(2025, 1, 1)}
	for _, v := range []any{src1, src2, src3} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Import Source Periods ────────────────────────────────────────────────
	for _, v := range []any{
		&model.ImportSourcePeriod{OrganizationID: org1.ID, ImportSourceID: src1.ID, Year: 2024},
		&model.ImportSourcePeriod{OrganizationID: org1.ID, ImportSourceID: src2.ID, Year: 2025},
		&model.ImportSourcePeriod{OrganizationID: org2.ID, ImportSourceID: src3.ID, Year: 2025},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Transaction Accounts ─────────────────────────────────────────────────
	// org1 – linked to Volksbank CSV import source
	ta1 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "1000", DisplayName: "Kasse"}
	ta2 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "1200", DisplayName: "Girokonto"}
	ta3 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "4000", DisplayName: "Mitgliedsbeiträge"}
	ta4 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "4100", DisplayName: "Veranstaltungserlöse"}
	ta5 := &model.TransactionAccount{OrganizationID: org1.ID, ImportSourceID: src1.ID, Code: "6000", DisplayName: "Raummiete"}
	// org2 – linked to Datev export
	ta6 := &model.TransactionAccount{OrganizationID: org2.ID, ImportSourceID: src3.ID, Code: "1210", DisplayName: "Geschäftskonto"}
	ta7 := &model.TransactionAccount{OrganizationID: org2.ID, ImportSourceID: src3.ID, Code: "8000", DisplayName: "Erlöse Aufträge"}
	ta8 := &model.TransactionAccount{OrganizationID: org2.ID, ImportSourceID: src3.ID, Code: "5000", DisplayName: "Materialaufwand"}
	ta9 := &model.TransactionAccount{OrganizationID: org2.ID, ImportSourceID: src3.ID, Code: "6200", DisplayName: "Löhne und Gehälter"}
	for _, v := range []any{ta1, ta2, ta3, ta4, ta5, ta6, ta7, ta8, ta9} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Transactions ─────────────────────────────────────────────────────────
	// org1 transactions (association)
	txOrg1 := []*model.Transaction_{
		{
			OrganizationID: org1.ID, CreditTransactionAccountID: ta2.ID, DebitTransactionAccountID: ta3.ID,
			Amount: dec("240.00"), Description: "Mitgliedsbeiträge Januar", Reference: "MB-2024-01",
			BookedAt: date(2024, 1, 5), DocumentDate: date(2024, 1, 5),
		},
		{
			OrganizationID: org1.ID, CreditTransactionAccountID: ta2.ID, DebitTransactionAccountID: ta4.ID,
			Amount: dec("1850.00"), Description: "Einnahmen Neujahrsfeier", Reference: "VE-2024-01",
			BookedAt: date(2024, 1, 20), DocumentDate: date(2024, 1, 19),
		},
		{
			OrganizationID: org1.ID, CreditTransactionAccountID: ta5.ID, DebitTransactionAccountID: ta2.ID,
			Amount: dec("600.00"), Description: "Miete Februar", Reference: "MIETE-2024-02",
			BookedAt: date(2024, 2, 1), DocumentDate: date(2024, 2, 1),
		},
		{
			OrganizationID: org1.ID, CreditTransactionAccountID: ta2.ID, DebitTransactionAccountID: ta3.ID,
			Amount: dec("240.00"), Description: "Mitgliedsbeiträge Februar", Reference: "MB-2024-02",
			BookedAt: date(2024, 2, 5), DocumentDate: date(2024, 2, 5),
		},
		{
			OrganizationID: org1.ID, CreditTransactionAccountID: ta1.ID, DebitTransactionAccountID: ta2.ID,
			Amount: dec("300.00"), Description: "Barabhebung für Veranstaltung", Reference: "BAR-2024-01",
			BookedAt: date(2024, 3, 10), DocumentDate: date(2024, 3, 10),
		},
	}
	// org2 transactions (craft company)
	txOrg2 := []*model.Transaction_{
		{
			OrganizationID: org2.ID, CreditTransactionAccountID: ta7.ID, DebitTransactionAccountID: ta6.ID,
			Amount: dec("8500.00"), Description: "Rechnung Auftrag K-2025-01", Reference: "RE-2025-001",
			BookedAt: date(2025, 1, 10), DocumentDate: date(2025, 1, 8),
		},
		{
			OrganizationID: org2.ID, CreditTransactionAccountID: ta8.ID, DebitTransactionAccountID: ta6.ID,
			Amount: dec("3200.00"), Description: "Materialeinkauf Stahl", Reference: "EK-2025-001",
			BookedAt: date(2025, 1, 14), DocumentDate: date(2025, 1, 12),
		},
		{
			OrganizationID: org2.ID, CreditTransactionAccountID: ta9.ID, DebitTransactionAccountID: ta6.ID,
			Amount: dec("11000.00"), Description: "Lohnzahlung Januar", Reference: "LOHN-2025-01",
			BookedAt: date(2025, 1, 28), DocumentDate: date(2025, 1, 28),
		},
		{
			OrganizationID: org2.ID, CreditTransactionAccountID: ta7.ID, DebitTransactionAccountID: ta6.ID,
			Amount: dec("12400.00"), Description: "Rechnung Auftrag K-2025-02", Reference: "RE-2025-002",
			BookedAt: date(2025, 2, 7), DocumentDate: date(2025, 2, 5),
		},
		{
			OrganizationID: org2.ID, CreditTransactionAccountID: ta8.ID, DebitTransactionAccountID: ta6.ID,
			Amount: dec("4750.00"), Description: "Materialeinkauf Holz und Schrauben", Reference: "EK-2025-002",
			BookedAt: date(2025, 2, 11), DocumentDate: date(2025, 2, 10),
		},
		{
			OrganizationID: org2.ID, CreditTransactionAccountID: ta9.ID, DebitTransactionAccountID: ta6.ID,
			Amount: dec("11000.00"), Description: "Lohnzahlung Februar", Reference: "LOHN-2025-02",
			BookedAt: date(2025, 2, 27), DocumentDate: date(2025, 2, 27),
		},
	}
	for _, v := range txOrg1 {
		if err := cr(db, v); err != nil {
			return err
		}
	}
	for _, v := range txOrg2 {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Transaction Account Assignments ──────────────────────────────────────
	// org1
	for _, pair := range [][2]any{
		{txOrg1[0].ID, acc3.ID}, // Mitgliedsbeiträge → acc3
		{txOrg1[1].ID, acc4.ID}, // Veranstaltungserlöse → acc4
		{txOrg1[2].ID, acc5.ID}, // Raummiete → acc5
		{txOrg1[3].ID, acc3.ID},
		{txOrg1[4].ID, acc1.ID},
	} {
		txID := pair[0].(uuid.UUID)
		acctID := pair[1].(uuid.UUID)
		txn := txOrg1[0]
		for _, t := range txOrg1 {
			if t.ID == txID {
				txn = t
				break
			}
		}
		if err := cr(db, &model.TransactionAccountAssignment{
			OrganizationID: org1.ID, TransactionID: txID, AccountID: acctID, Value: txn.Amount,
		}); err != nil {
			return err
		}
	}
	// org2
	for _, pair := range [][2]any{
		{txOrg2[0].ID, acc10.ID}, // Erlöse
		{txOrg2[1].ID, acc11.ID}, // Material
		{txOrg2[2].ID, acc12.ID}, // Löhne
		{txOrg2[3].ID, acc10.ID},
		{txOrg2[4].ID, acc11.ID},
		{txOrg2[5].ID, acc12.ID},
	} {
		txID := pair[0].(uuid.UUID)
		acctID := pair[1].(uuid.UUID)
		txn := txOrg2[0]
		for _, t := range txOrg2 {
			if t.ID == txID {
				txn = t
				break
			}
		}
		if err := cr(db, &model.TransactionAccountAssignment{
			OrganizationID: org2.ID, TransactionID: txID, AccountID: acctID, Value: txn.Amount,
		}); err != nil {
			return err
		}
	}

	// ── Report Templates ─────────────────────────────────────────────────────
	for _, v := range []any{
		&model.ReportTemplate{OrganizationID: org1.ID, DisplayName: "Monatsbericht Verein", Template: "# Monatsbericht\n\n## Einnahmen\n\n## Ausgaben"},
		&model.ReportTemplate{OrganizationID: org1.ID, DisplayName: "Jahresabschluss Verein", Template: "# Jahresabschluss\n\n## Bilanz\n\n## Ergebnis"},
		&model.ReportTemplate{OrganizationID: org2.ID, DisplayName: "Quartalsbericht", Template: "# Quartalsbericht\n\n## Umsatz\n\n## Kosten\n\n## Ergebnis"},
		&model.ReportTemplate{OrganizationID: org2.ID, DisplayName: "Auftragsübersicht", Template: "# Auftragsübersicht\n\n## Offene Aufträge\n\n## Erlöse"},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	// ── Reports ──────────────────────────────────────────────────────────────
	for _, v := range []any{
		&model.Report{OrganizationID: org1.ID, DisplayName: "Januar 2024", Data: []byte("Monatsbericht Januar 2024 – Verein Musterstadt")},
		&model.Report{OrganizationID: org1.ID, DisplayName: "Jahresabschluss 2024", Data: []byte("Jahresabschluss 2024 – Verein Musterstadt")},
		&model.Report{OrganizationID: org2.ID, DisplayName: "Q1 2025", Data: []byte("Quartalsbericht Q1 2025 – Handwerk Süd GmbH")},
		&model.Report{OrganizationID: org2.ID, DisplayName: "Auftragsübersicht Februar 2025", Data: []byte("Offene und abgeschlossene Aufträge Februar 2025")},
	} {
		if err := cr(db, v); err != nil {
			return err
		}
	}

	return nil
}
