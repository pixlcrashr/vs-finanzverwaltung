-- reverse: create index "idx_auth_sessions_token" to table: "auth_sessions"
DROP INDEX `idx_auth_sessions_token`;
-- reverse: create index "idx_auth_sessions_user_id" to table: "auth_sessions"
DROP INDEX `idx_auth_sessions_user_id`;
-- reverse: create "auth_sessions" table
DROP TABLE `auth_sessions`;
-- reverse: create index "idx_oauth2_tokens_signature_type" to table: "oauth2_tokens"
DROP INDEX `idx_oauth2_tokens_signature_type`;
-- reverse: create index "idx_oauth2_tokens_request_type" to table: "oauth2_tokens"
DROP INDEX `idx_oauth2_tokens_request_type`;
-- reverse: create index "idx_oauth2_tokens_client_id" to table: "oauth2_tokens"
DROP INDEX `idx_oauth2_tokens_client_id`;
-- reverse: create index "idx_oauth2_tokens_user_id" to table: "oauth2_tokens"
DROP INDEX `idx_oauth2_tokens_user_id`;
-- reverse: create "oauth2_tokens" table
DROP TABLE `oauth2_tokens`;
-- reverse: create index "idx_oauth2_clients_client_id" to table: "oauth2_clients"
DROP INDEX `idx_oauth2_clients_client_id`;
-- reverse: create "oauth2_clients" table
DROP TABLE `oauth2_clients`;
-- reverse: create index "idx_casbin_rule_ptype" to table: "casbin_rule"
DROP INDEX `idx_casbin_rule_ptype`;
-- reverse: create index "idx_casbin_rule_v0" to table: "casbin_rule"
DROP INDEX `idx_casbin_rule_v0`;
-- reverse: create index "idx_casbin_rule_v1" to table: "casbin_rule"
DROP INDEX `idx_casbin_rule_v1`;
-- reverse: create index "idx_casbin_rule_v2" to table: "casbin_rule"
DROP INDEX `idx_casbin_rule_v2`;
-- reverse: create "casbin_rule" table
DROP TABLE `casbin_rule`;
-- reverse: create index "idx_user_groups_custom_id" to table: "user_groups"
DROP INDEX `idx_user_groups_custom_id`;
-- reverse: create index "idx_user_groups_name" to table: "user_groups"
DROP INDEX `idx_user_groups_name`;
-- reverse: create "user_groups" table
DROP TABLE `user_groups`;
-- reverse: create index "idx_user_settings_user_id" to table: "user_settings"
DROP INDEX `idx_user_settings_user_id`;
-- reverse: create "user_settings" table
DROP TABLE `user_settings`;
-- reverse: create index "idx_user_identities_custom_id" to table: "user_identities"
DROP INDEX `idx_user_identities_custom_id`;
-- reverse: create index "idx_user_identities_user_id" to table: "user_identities"
DROP INDEX `idx_user_identities_user_id`;
-- reverse: create index "idx_user_identities_provider" to table: "user_identities"
DROP INDEX `idx_user_identities_provider`;
-- reverse: create index "idx_user_identities_provider_user" to table: "user_identities"
DROP INDEX `idx_user_identities_provider_user`;
-- reverse: create "user_identities" table
DROP TABLE `user_identities`;
-- reverse: create index "idx_users_email" to table: "users"
DROP INDEX `idx_users_email`;
-- reverse: create "users" table
DROP TABLE `users`;
-- reverse: create index "idx_reports_org_id" to table: "reports"
DROP INDEX `idx_reports_org_id`;
-- reverse: create index "idx_reports_custom_id_org" to table: "reports"
DROP INDEX `idx_reports_custom_id_org`;
-- reverse: create "reports" table
DROP TABLE `reports`;
-- reverse: create index "idx_report_templates_org_id" to table: "report_templates"
DROP INDEX `idx_report_templates_org_id`;
-- reverse: create index "idx_report_templates_custom_id_org" to table: "report_templates"
DROP INDEX `idx_report_templates_custom_id_org`;
-- reverse: create "report_templates" table
DROP TABLE `report_templates`;
-- reverse: create index "idx_transaction_assignments_org_id" to table: "transaction_assignments"
DROP INDEX `idx_transaction_assignments_org_id`;
-- reverse: create "transaction_assignments" table
DROP TABLE `transaction_assignments`;
-- reverse: create index "idx_transactions_org_id" to table: "transactions"
DROP INDEX `idx_transactions_org_id`;
-- reverse: create index "idx_transactions_custom_id_org" to table: "transactions"
DROP INDEX `idx_transactions_custom_id_org`;
-- reverse: create index "idx_transactions_unique_entry" to table: "transactions"
DROP INDEX `idx_transactions_unique_entry`;
-- reverse: create "transactions" table
DROP TABLE `transactions`;
-- reverse: create index "idx_ledger_accounts_org_id" to table: "ledger_accounts"
DROP INDEX `idx_ledger_accounts_org_id`;
-- reverse: create index "idx_ledger_accounts_custom_id" to table: "ledger_accounts"
DROP INDEX `idx_ledger_accounts_custom_id`;
-- reverse: create index "idx_ledger_accounts_org_code" to table: "ledger_accounts"
DROP INDEX `idx_ledger_accounts_org_code`;
-- reverse: create index "idx_ledger_accounts_code" to table: "ledger_accounts"
DROP INDEX `idx_ledger_accounts_code`;
-- reverse: create index "idx_ledger_accounts_display_name" to table: "ledger_accounts"
DROP INDEX `idx_ledger_accounts_display_name`;
-- reverse: create "ledger_accounts" table
DROP TABLE `ledger_accounts`;
-- reverse: create index "idx_ledger_years_org_id" to table: "ledger_years"
DROP INDEX `idx_ledger_years_org_id`;
-- reverse: create index "idx_ledger_years_custom_id" to table: "ledger_years"
DROP INDEX `idx_ledger_years_custom_id`;
-- reverse: create index "idx_ledger_years_org_year" to table: "ledger_years"
DROP INDEX `idx_ledger_years_org_year`;
-- reverse: create "ledger_years" table
DROP TABLE `ledger_years`;
-- reverse: create index "idx_budget_account_values_org_id" to table: "budget_account_values"
DROP INDEX `idx_budget_account_values_org_id`;
-- reverse: create index "idx_budget_account_values_custom_id" to table: "budget_account_values"
DROP INDEX `idx_budget_account_values_custom_id`;
-- reverse: create index "idx_budget_account_values_org_budget_account" to table: "budget_account_values"
DROP INDEX `idx_budget_account_values_org_budget_account`;
-- reverse: create "budget_account_values" table
DROP TABLE `budget_account_values`;
-- reverse: create index "idx_budget_tag_account_values_org_id" to table: "budget_revision_account_values"
DROP INDEX `idx_budget_tag_account_values_org_id`;
-- reverse: create index "idx_budget_revision_account_values_custom_id" to table: "budget_revision_account_values"
DROP INDEX `idx_budget_revision_account_values_custom_id`;
-- reverse: create index "idx_budget_tag_account_values_org_tag_account" to table: "budget_revision_account_values"
DROP INDEX `idx_budget_tag_account_values_org_tag_account`;
-- reverse: create index "idx_budget_revision_account_values_value" to table: "budget_revision_account_values"
DROP INDEX `idx_budget_revision_account_values_value`;
-- reverse: create "budget_revision_account_values" table
DROP TABLE `budget_revision_account_values`;
-- reverse: create index "idx_budget_tags_org_id" to table: "budget_revisions"
DROP INDEX `idx_budget_tags_org_id`;
-- reverse: create index "idx_budget_revisions_custom_id" to table: "budget_revisions"
DROP INDEX `idx_budget_revisions_custom_id`;
-- reverse: create index "idx_budget_tags_org_budget" to table: "budget_revisions"
DROP INDEX `idx_budget_tags_org_budget`;
-- reverse: create index "idx_budget_revisions_date" to table: "budget_revisions"
DROP INDEX `idx_budget_revisions_date`;
-- reverse: create "budget_revisions" table
DROP TABLE `budget_revisions`;
-- reverse: create index "idx_budgets_org_id" to table: "budgets"
DROP INDEX `idx_budgets_org_id`;
-- reverse: create index "idx_budgets_custom_id_org" to table: "budgets"
DROP INDEX `idx_budgets_custom_id_org`;
-- reverse: create index "idx_budgets_display_name" to table: "budgets"
DROP INDEX `idx_budgets_display_name`;
-- reverse: create "budgets" table
DROP TABLE `budgets`;
-- reverse: create index "idx_account_group_assignments_org_id" to table: "account_group_assignments"
DROP INDEX `idx_account_group_assignments_org_id`;
-- reverse: create index "idx_account_group_assignments_custom_id" to table: "account_group_assignments"
DROP INDEX `idx_account_group_assignments_custom_id`;
-- reverse: create index "idx_account_group_assignments_org_group_account" to table: "account_group_assignments"
DROP INDEX `idx_account_group_assignments_org_group_account`;
-- reverse: create index "idx_account_group_assignments_negate" to table: "account_group_assignments"
DROP INDEX `idx_account_group_assignments_negate`;
-- reverse: create "account_group_assignments" table
DROP TABLE `account_group_assignments`;
-- reverse: create index "idx_accounts_org_id" to table: "accounts"
DROP INDEX `idx_accounts_org_id`;
-- reverse: create index "idx_accounts_custom_id_org" to table: "accounts"
DROP INDEX `idx_accounts_custom_id_org`;
-- reverse: create index "idx_accounts_parent_account_id" to table: "accounts"
DROP INDEX `idx_accounts_parent_account_id`;
-- reverse: create index "idx_accounts_display_name" to table: "accounts"
DROP INDEX `idx_accounts_display_name`;
-- reverse: create index "idx_accounts_display_code" to table: "accounts"
DROP INDEX `idx_accounts_display_code`;
-- reverse: create index "idx_accounts_is_container" to table: "accounts"
DROP INDEX `idx_accounts_is_container`;
-- reverse: create "accounts" table
DROP TABLE `accounts`;
-- reverse: create index "idx_account_groups_org_id" to table: "account_groups"
DROP INDEX `idx_account_groups_org_id`;
-- reverse: create index "idx_account_groups_custom_id_org" to table: "account_groups"
DROP INDEX `idx_account_groups_custom_id_org`;
-- reverse: create "account_groups" table
DROP TABLE `account_groups`;
-- reverse: create index "idx_organizations_custom_id" to table: "organizations"
DROP INDEX `idx_organizations_custom_id`;
-- reverse: create "organizations" table
DROP TABLE `organizations`;
