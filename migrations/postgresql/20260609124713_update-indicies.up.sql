-- modify "transaction_account_assignments" table
ALTER TABLE "public"."transaction_account_assignments" ADD COLUMN "custom_id" text NULL;
-- create index "idx_transaction_account_assignments_custom_id" to table: "transaction_account_assignments"
CREATE UNIQUE INDEX "idx_transaction_account_assignments_custom_id" ON "public"."transaction_account_assignments" ("custom_id", "organization_id", "transaction_id");
-- modify "organizations" table
ALTER TABLE "public"."organizations" ADD COLUMN "custom_id" text NULL;
-- create index "idx_organizations_custom_id" to table: "organizations"
CREATE UNIQUE INDEX "idx_organizations_custom_id" ON "public"."organizations" ("custom_id");
-- modify "accounts" table
ALTER TABLE "public"."accounts" ADD COLUMN "custom_id" text NULL;
-- create index "idx_accounts_custom_id_org" to table: "accounts"
CREATE UNIQUE INDEX "idx_accounts_custom_id_org" ON "public"."accounts" ("custom_id", "organization_id");
-- modify "budget_account_values" table
ALTER TABLE "public"."budget_account_values" ADD COLUMN "custom_id" text NULL;
-- create index "idx_budget_account_values_custom_id" to table: "budget_account_values"
CREATE UNIQUE INDEX "idx_budget_account_values_custom_id" ON "public"."budget_account_values" ("custom_id", "organization_id", "budget_id");
-- modify "user_identities" table
ALTER TABLE "public"."user_identities" ADD COLUMN "custom_id" text NULL;
-- create index "idx_user_identities_custom_id" to table: "user_identities"
CREATE UNIQUE INDEX "idx_user_identities_custom_id" ON "public"."user_identities" ("custom_id", "user_id");
-- modify "budget_revisions" table
ALTER TABLE "public"."budget_revisions" ADD COLUMN "custom_id" text NULL;
-- create index "idx_budget_revisions_custom_id" to table: "budget_revisions"
CREATE UNIQUE INDEX "idx_budget_revisions_custom_id" ON "public"."budget_revisions" ("custom_id", "organization_id", "budget_id");
-- modify "user_groups" table
ALTER TABLE "public"."user_groups" ADD COLUMN "custom_id" text NULL;
-- create index "idx_user_groups_custom_id" to table: "user_groups"
CREATE UNIQUE INDEX "idx_user_groups_custom_id" ON "public"."user_groups" ("custom_id");
-- modify "import_source_periods" table
ALTER TABLE "public"."import_source_periods" ADD COLUMN "custom_id" text NULL;
-- create index "idx_import_source_periods_custom_id" to table: "import_source_periods"
CREATE UNIQUE INDEX "idx_import_source_periods_custom_id" ON "public"."import_source_periods" ("custom_id", "organization_id", "import_source_id");
-- modify "account_groups" table
ALTER TABLE "public"."account_groups" ADD COLUMN "custom_id" text NULL;
-- create index "idx_account_groups_custom_id_org" to table: "account_groups"
CREATE UNIQUE INDEX "idx_account_groups_custom_id_org" ON "public"."account_groups" ("custom_id", "organization_id");
-- modify "report_templates" table
ALTER TABLE "public"."report_templates" ADD COLUMN "custom_id" text NULL;
-- create index "idx_report_templates_custom_id_org" to table: "report_templates"
CREATE UNIQUE INDEX "idx_report_templates_custom_id_org" ON "public"."report_templates" ("custom_id", "organization_id");
-- modify "import_sources" table
ALTER TABLE "public"."import_sources" ADD COLUMN "custom_id" text NULL;
-- create index "idx_import_sources_custom_id_org" to table: "import_sources"
CREATE UNIQUE INDEX "idx_import_sources_custom_id_org" ON "public"."import_sources" ("custom_id", "organization_id");
-- modify "reports" table
ALTER TABLE "public"."reports" ADD COLUMN "custom_id" text NULL;
-- create index "idx_reports_custom_id_org" to table: "reports"
CREATE UNIQUE INDEX "idx_reports_custom_id_org" ON "public"."reports" ("custom_id", "organization_id");
-- modify "account_group_assignments" table
ALTER TABLE "public"."account_group_assignments" ADD COLUMN "custom_id" text NULL;
-- create index "idx_account_group_assignments_custom_id" to table: "account_group_assignments"
CREATE UNIQUE INDEX "idx_account_group_assignments_custom_id" ON "public"."account_group_assignments" ("custom_id", "organization_id", "account_group_id");
-- modify "transaction_accounts" table
ALTER TABLE "public"."transaction_accounts" ADD COLUMN "custom_id" text NULL;
-- create index "idx_transaction_accounts_custom_id_org" to table: "transaction_accounts"
CREATE UNIQUE INDEX "idx_transaction_accounts_custom_id_org" ON "public"."transaction_accounts" ("custom_id", "organization_id");
-- modify "transactions" table
ALTER TABLE "public"."transactions" ADD COLUMN "custom_id" text NULL;
-- create index "idx_transactions_custom_id_org" to table: "transactions"
CREATE UNIQUE INDEX "idx_transactions_custom_id_org" ON "public"."transactions" ("custom_id", "organization_id");
-- modify "budgets" table
ALTER TABLE "public"."budgets" ADD COLUMN "custom_id" text NULL;
-- create index "idx_budgets_custom_id_org" to table: "budgets"
CREATE UNIQUE INDEX "idx_budgets_custom_id_org" ON "public"."budgets" ("custom_id", "organization_id");
-- drop index "idx_budget_tag_account_values_org_tag_account" from table: "budget_revision_account_values"
DROP INDEX "public"."idx_budget_tag_account_values_org_tag_account";
-- rename a column from "budget_tag_id" to "budget_id"
ALTER TABLE "public"."budget_revision_account_values" RENAME COLUMN "budget_tag_id" TO "budget_id";
-- modify "budget_revision_account_values" table
ALTER TABLE "public"."budget_revision_account_values" DROP CONSTRAINT "fk_budget_revisions_budget_revision_account_values", ADD COLUMN "custom_id" text NULL, ADD COLUMN "budget_revision_id" uuid NOT NULL, ADD CONSTRAINT "fk_budget_revisions_budget_revision_account_values" FOREIGN KEY ("budget_revision_id") REFERENCES "public"."budget_revisions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "fk_budget_revision_account_values_budget" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- create index "idx_budget_tag_account_values_org_tag_account" to table: "budget_revision_account_values"
CREATE UNIQUE INDEX "idx_budget_tag_account_values_org_tag_account" ON "public"."budget_revision_account_values" ("organization_id", "budget_id", "budget_revision_id", "account_id");
-- create index "idx_budget_revision_account_values_custom_id" to table: "budget_revision_account_values"
CREATE UNIQUE INDEX "idx_budget_revision_account_values_custom_id" ON "public"."budget_revision_account_values" ("custom_id", "organization_id", "budget_id", "budget_revision_id");
