-- reverse: create index "idx_budget_revision_account_values_custom_id" to table: "budget_revision_account_values"
DROP INDEX "public"."idx_budget_revision_account_values_custom_id";
-- reverse: create index "idx_budget_tag_account_values_org_tag_account" to table: "budget_revision_account_values"
DROP INDEX "public"."idx_budget_tag_account_values_org_tag_account";
-- reverse: modify "budget_revision_account_values" table
ALTER TABLE "public"."budget_revision_account_values" DROP CONSTRAINT "fk_budget_revision_account_values_budget", DROP CONSTRAINT "fk_budget_revisions_budget_revision_account_values", DROP COLUMN "budget_revision_id", DROP COLUMN "custom_id", ADD CONSTRAINT "fk_budget_revisions_budget_revision_account_values" FOREIGN KEY ("budget_tag_id") REFERENCES "public"."budget_revisions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- reverse: rename a column from "budget_tag_id" to "budget_id"
ALTER TABLE "public"."budget_revision_account_values" RENAME COLUMN "budget_id" TO "budget_tag_id";
-- reverse: drop index "idx_budget_tag_account_values_org_tag_account" from table: "budget_revision_account_values"
CREATE UNIQUE INDEX "idx_budget_tag_account_values_org_tag_account" ON "public"."budget_revision_account_values" ("organization_id", "budget_tag_id", "account_id");
-- reverse: create index "idx_budgets_custom_id_org" to table: "budgets"
DROP INDEX "public"."idx_budgets_custom_id_org";
-- reverse: modify "budgets" table
ALTER TABLE "public"."budgets" DROP COLUMN "custom_id";
-- reverse: create index "idx_transactions_custom_id_org" to table: "transactions"
DROP INDEX "public"."idx_transactions_custom_id_org";
-- reverse: modify "transactions" table
ALTER TABLE "public"."transactions" DROP COLUMN "custom_id";
-- reverse: create index "idx_transaction_accounts_custom_id_org" to table: "transaction_accounts"
DROP INDEX "public"."idx_transaction_accounts_custom_id_org";
-- reverse: modify "transaction_accounts" table
ALTER TABLE "public"."transaction_accounts" DROP COLUMN "custom_id";
-- reverse: create index "idx_account_group_assignments_custom_id" to table: "account_group_assignments"
DROP INDEX "public"."idx_account_group_assignments_custom_id";
-- reverse: modify "account_group_assignments" table
ALTER TABLE "public"."account_group_assignments" DROP COLUMN "custom_id";
-- reverse: create index "idx_reports_custom_id_org" to table: "reports"
DROP INDEX "public"."idx_reports_custom_id_org";
-- reverse: modify "reports" table
ALTER TABLE "public"."reports" DROP COLUMN "custom_id";
-- reverse: create index "idx_import_sources_custom_id_org" to table: "import_sources"
DROP INDEX "public"."idx_import_sources_custom_id_org";
-- reverse: modify "import_sources" table
ALTER TABLE "public"."import_sources" DROP COLUMN "custom_id";
-- reverse: create index "idx_report_templates_custom_id_org" to table: "report_templates"
DROP INDEX "public"."idx_report_templates_custom_id_org";
-- reverse: modify "report_templates" table
ALTER TABLE "public"."report_templates" DROP COLUMN "custom_id";
-- reverse: create index "idx_account_groups_custom_id_org" to table: "account_groups"
DROP INDEX "public"."idx_account_groups_custom_id_org";
-- reverse: modify "account_groups" table
ALTER TABLE "public"."account_groups" DROP COLUMN "custom_id";
-- reverse: create index "idx_import_source_periods_custom_id" to table: "import_source_periods"
DROP INDEX "public"."idx_import_source_periods_custom_id";
-- reverse: modify "import_source_periods" table
ALTER TABLE "public"."import_source_periods" DROP COLUMN "custom_id";
-- reverse: create index "idx_user_groups_custom_id" to table: "user_groups"
DROP INDEX "public"."idx_user_groups_custom_id";
-- reverse: modify "user_groups" table
ALTER TABLE "public"."user_groups" DROP COLUMN "custom_id";
-- reverse: create index "idx_budget_revisions_custom_id" to table: "budget_revisions"
DROP INDEX "public"."idx_budget_revisions_custom_id";
-- reverse: modify "budget_revisions" table
ALTER TABLE "public"."budget_revisions" DROP COLUMN "custom_id";
-- reverse: create index "idx_user_identities_custom_id" to table: "user_identities"
DROP INDEX "public"."idx_user_identities_custom_id";
-- reverse: modify "user_identities" table
ALTER TABLE "public"."user_identities" DROP COLUMN "custom_id";
-- reverse: create index "idx_budget_account_values_custom_id" to table: "budget_account_values"
DROP INDEX "public"."idx_budget_account_values_custom_id";
-- reverse: modify "budget_account_values" table
ALTER TABLE "public"."budget_account_values" DROP COLUMN "custom_id";
-- reverse: create index "idx_accounts_custom_id_org" to table: "accounts"
DROP INDEX "public"."idx_accounts_custom_id_org";
-- reverse: modify "accounts" table
ALTER TABLE "public"."accounts" DROP COLUMN "custom_id";
-- reverse: create index "idx_organizations_custom_id" to table: "organizations"
DROP INDEX "public"."idx_organizations_custom_id";
-- reverse: modify "organizations" table
ALTER TABLE "public"."organizations" DROP COLUMN "custom_id";
-- reverse: create index "idx_transaction_account_assignments_custom_id" to table: "transaction_account_assignments"
DROP INDEX "public"."idx_transaction_account_assignments_custom_id";
-- reverse: modify "transaction_account_assignments" table
ALTER TABLE "public"."transaction_account_assignments" DROP COLUMN "custom_id";
