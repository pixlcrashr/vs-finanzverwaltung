-- drop index "idx_ledger_years_org_year" from table: "ledger_years"
DROP INDEX "public"."idx_ledger_years_org_year";
-- create index "idx_ledger_years_org_year" to table: "ledger_years"
CREATE UNIQUE INDEX "idx_ledger_years_org_year" ON "public"."ledger_years" ("organization_id", "year");
