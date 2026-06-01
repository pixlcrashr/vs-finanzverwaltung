-- reverse: create index "idx_user_identities_user_id" to table: "user_identities"
DROP INDEX "public"."idx_user_identities_user_id";
-- reverse: create index "idx_user_identities_provider_user" to table: "user_identities"
DROP INDEX "public"."idx_user_identities_provider_user";
-- reverse: create index "idx_user_identities_provider" to table: "user_identities"
DROP INDEX "public"."idx_user_identities_provider";
-- reverse: create "user_identities" table
DROP TABLE "public"."user_identities";
-- reverse: create index "idx_users_email" to table: "users"
DROP INDEX "public"."idx_users_email";
-- reverse: create "users" table
DROP TABLE "public"."users";
-- reverse: create index "idx_transaction_account_assignments_org_trans_account" to table: "transaction_account_assignments"
DROP INDEX "public"."idx_transaction_account_assignments_org_trans_account";
-- reverse: create index "idx_transaction_account_assignments_org_id" to table: "transaction_account_assignments"
DROP INDEX "public"."idx_transaction_account_assignments_org_id";
-- reverse: create "transaction_account_assignments" table
DROP TABLE "public"."transaction_account_assignments";
-- reverse: create index "idx_transactions_unique_entry" to table: "transactions"
DROP INDEX "public"."idx_transactions_unique_entry";
-- reverse: create index "idx_transactions_org_id" to table: "transactions"
DROP INDEX "public"."idx_transactions_org_id";
-- reverse: create "transactions" table
DROP TABLE "public"."transactions";
-- reverse: create index "idx_transaction_accounts_org_id" to table: "transaction_accounts"
DROP INDEX "public"."idx_transaction_accounts_org_id";
-- reverse: create index "idx_transaction_accounts_org_code_source" to table: "transaction_accounts"
DROP INDEX "public"."idx_transaction_accounts_org_code_source";
-- reverse: create index "idx_transaction_accounts_display_name" to table: "transaction_accounts"
DROP INDEX "public"."idx_transaction_accounts_display_name";
-- reverse: create index "idx_transaction_accounts_code" to table: "transaction_accounts"
DROP INDEX "public"."idx_transaction_accounts_code";
-- reverse: create "transaction_accounts" table
DROP TABLE "public"."transaction_accounts";
-- reverse: create index "idx_reports_org_id" to table: "reports"
DROP INDEX "public"."idx_reports_org_id";
-- reverse: create "reports" table
DROP TABLE "public"."reports";
-- reverse: create index "idx_report_templates_org_id" to table: "report_templates"
DROP INDEX "public"."idx_report_templates_org_id";
-- reverse: create "report_templates" table
DROP TABLE "public"."report_templates";
-- reverse: create index "idx_import_source_periods_source_year" to table: "import_source_periods"
DROP INDEX "public"."idx_import_source_periods_source_year";
-- reverse: create index "idx_import_source_periods_org_source" to table: "import_source_periods"
DROP INDEX "public"."idx_import_source_periods_org_source";
-- reverse: create index "idx_import_source_periods_org_id" to table: "import_source_periods"
DROP INDEX "public"."idx_import_source_periods_org_id";
-- reverse: create "import_source_periods" table
DROP TABLE "public"."import_source_periods";
-- reverse: create index "idx_import_sources_org_id" to table: "import_sources"
DROP INDEX "public"."idx_import_sources_org_id";
-- reverse: create "import_sources" table
DROP TABLE "public"."import_sources";
-- reverse: create index "idx_budget_tag_account_values_org_tag_account" to table: "budget_revision_account_values"
DROP INDEX "public"."idx_budget_tag_account_values_org_tag_account";
-- reverse: create index "idx_budget_tag_account_values_org_id" to table: "budget_revision_account_values"
DROP INDEX "public"."idx_budget_tag_account_values_org_id";
-- reverse: create index "idx_budget_revision_account_values_value" to table: "budget_revision_account_values"
DROP INDEX "public"."idx_budget_revision_account_values_value";
-- reverse: create "budget_revision_account_values" table
DROP TABLE "public"."budget_revision_account_values";
-- reverse: create index "idx_budget_tags_org_id" to table: "budget_revisions"
DROP INDEX "public"."idx_budget_tags_org_id";
-- reverse: create index "idx_budget_tags_org_budget" to table: "budget_revisions"
DROP INDEX "public"."idx_budget_tags_org_budget";
-- reverse: create index "idx_budget_revisions_date" to table: "budget_revisions"
DROP INDEX "public"."idx_budget_revisions_date";
-- reverse: create "budget_revisions" table
DROP TABLE "public"."budget_revisions";
-- reverse: create index "idx_budgets_org_id" to table: "budgets"
DROP INDEX "public"."idx_budgets_org_id";
-- reverse: create index "idx_budgets_display_name" to table: "budgets"
DROP INDEX "public"."idx_budgets_display_name";
-- reverse: create "budgets" table
DROP TABLE "public"."budgets";
-- reverse: create index "idx_account_group_assignments_org_id" to table: "account_group_assignments"
DROP INDEX "public"."idx_account_group_assignments_org_id";
-- reverse: create index "idx_account_group_assignments_org_group_account" to table: "account_group_assignments"
DROP INDEX "public"."idx_account_group_assignments_org_group_account";
-- reverse: create index "idx_account_group_assignments_negate" to table: "account_group_assignments"
DROP INDEX "public"."idx_account_group_assignments_negate";
-- reverse: create "account_group_assignments" table
DROP TABLE "public"."account_group_assignments";
-- reverse: create index "idx_accounts_parent_account_id" to table: "accounts"
DROP INDEX "public"."idx_accounts_parent_account_id";
-- reverse: create index "idx_accounts_org_id" to table: "accounts"
DROP INDEX "public"."idx_accounts_org_id";
-- reverse: create index "idx_accounts_is_container" to table: "accounts"
DROP INDEX "public"."idx_accounts_is_container";
-- reverse: create index "idx_accounts_display_name" to table: "accounts"
DROP INDEX "public"."idx_accounts_display_name";
-- reverse: create index "idx_accounts_display_code" to table: "accounts"
DROP INDEX "public"."idx_accounts_display_code";
-- reverse: create "accounts" table
DROP TABLE "public"."accounts";
-- reverse: create index "idx_account_groups_org_id" to table: "account_groups"
DROP INDEX "public"."idx_account_groups_org_id";
-- reverse: create "account_groups" table
DROP TABLE "public"."account_groups";
-- reverse: create index "idx_user_groups_name" to table: "user_groups"
DROP INDEX "public"."idx_user_groups_name";
-- reverse: create "user_groups" table
DROP TABLE "public"."user_groups";
-- reverse: create index "idx_casbin_rule_v2" to table: "casbin_rule"
DROP INDEX "public"."idx_casbin_rule_v2";
-- reverse: create index "idx_casbin_rule_v1" to table: "casbin_rule"
DROP INDEX "public"."idx_casbin_rule_v1";
-- reverse: create index "idx_casbin_rule_v0" to table: "casbin_rule"
DROP INDEX "public"."idx_casbin_rule_v0";
-- reverse: create index "idx_casbin_rule_ptype" to table: "casbin_rule"
DROP INDEX "public"."idx_casbin_rule_ptype";
-- reverse: create "casbin_rule" table
DROP TABLE "public"."casbin_rule";
-- reverse: create "organizations" table
DROP TABLE "public"."organizations";
