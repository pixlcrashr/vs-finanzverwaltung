-- create "organizations" table
CREATE TABLE `organizations` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `display_name` text NOT NULL DEFAULT '',
  `start_month` integer NOT NULL DEFAULT 1,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`)
);
-- create index "idx_organizations_custom_id" to table: "organizations"
CREATE UNIQUE INDEX `idx_organizations_custom_id` ON `organizations` (`custom_id`);
-- create "account_groups" table
CREATE TABLE `account_groups` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `display_name` text NOT NULL DEFAULT '',
  `display_description` text NOT NULL DEFAULT '',
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_account_groups` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_account_groups_custom_id_org" to table: "account_groups"
CREATE UNIQUE INDEX `idx_account_groups_custom_id_org` ON `account_groups` (`custom_id`, `organization_id`);
-- create index "idx_account_groups_org_id" to table: "account_groups"
CREATE UNIQUE INDEX `idx_account_groups_org_id` ON `account_groups` (`id`, `organization_id`);
-- create "accounts" table
CREATE TABLE `accounts` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `parent_account_id` uuid NULL,
  `display_name` text NOT NULL DEFAULT '',
  `display_code` text NOT NULL DEFAULT '',
  `display_description` text NOT NULL DEFAULT '',
  `is_container` numeric NOT NULL DEFAULT false,
  `is_archived` numeric NOT NULL DEFAULT false,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_accounts_child_accounts` FOREIGN KEY (`parent_account_id`) REFERENCES `accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_organizations_accounts` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_accounts_is_container" to table: "accounts"
CREATE INDEX `idx_accounts_is_container` ON `accounts` (`is_container`);
-- create index "idx_accounts_display_code" to table: "accounts"
CREATE INDEX `idx_accounts_display_code` ON `accounts` (`display_code`);
-- create index "idx_accounts_display_name" to table: "accounts"
CREATE INDEX `idx_accounts_display_name` ON `accounts` (`display_name`);
-- create index "idx_accounts_parent_account_id" to table: "accounts"
CREATE INDEX `idx_accounts_parent_account_id` ON `accounts` (`parent_account_id`);
-- create index "idx_accounts_custom_id_org" to table: "accounts"
CREATE UNIQUE INDEX `idx_accounts_custom_id_org` ON `accounts` (`custom_id`, `organization_id`);
-- create index "idx_accounts_org_id" to table: "accounts"
CREATE UNIQUE INDEX `idx_accounts_org_id` ON `accounts` (`id`, `organization_id`);
-- create "account_group_assignments" table
CREATE TABLE `account_group_assignments` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `account_group_id` uuid NOT NULL,
  `account_id` uuid NOT NULL,
  `negate` numeric NOT NULL DEFAULT false,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_accounts_account_group_assignments` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_account_groups_account_group_assignments` FOREIGN KEY (`account_group_id`) REFERENCES `account_groups` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_organizations_account_group_assignments` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_account_group_assignments_negate" to table: "account_group_assignments"
CREATE INDEX `idx_account_group_assignments_negate` ON `account_group_assignments` (`negate`);
-- create index "idx_account_group_assignments_org_group_account" to table: "account_group_assignments"
CREATE UNIQUE INDEX `idx_account_group_assignments_org_group_account` ON `account_group_assignments` (`organization_id`, `account_group_id`, `account_id`);
-- create index "idx_account_group_assignments_custom_id" to table: "account_group_assignments"
CREATE UNIQUE INDEX `idx_account_group_assignments_custom_id` ON `account_group_assignments` (`custom_id`, `organization_id`, `account_group_id`);
-- create index "idx_account_group_assignments_org_id" to table: "account_group_assignments"
CREATE UNIQUE INDEX `idx_account_group_assignments_org_id` ON `account_group_assignments` (`id`, `organization_id`);
-- create "budgets" table
CREATE TABLE `budgets` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `display_name` text NOT NULL DEFAULT '',
  `display_description` text NOT NULL DEFAULT '',
  `is_closed` numeric NOT NULL DEFAULT false,
  `period_start` datetime NOT NULL,
  `period_end` datetime NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_budgets` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_budgets_display_name" to table: "budgets"
CREATE INDEX `idx_budgets_display_name` ON `budgets` (`display_name`);
-- create index "idx_budgets_custom_id_org" to table: "budgets"
CREATE UNIQUE INDEX `idx_budgets_custom_id_org` ON `budgets` (`custom_id`, `organization_id`);
-- create index "idx_budgets_org_id" to table: "budgets"
CREATE UNIQUE INDEX `idx_budgets_org_id` ON `budgets` (`id`, `organization_id`);
-- create "budget_revisions" table
CREATE TABLE `budget_revisions` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `budget_id` uuid NOT NULL,
  `display_name` text NOT NULL DEFAULT '',
  `display_description` text NOT NULL DEFAULT '',
  `date` datetime NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_budget_revisions` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_budgets_budget_revisions` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_budget_revisions_date" to table: "budget_revisions"
CREATE INDEX `idx_budget_revisions_date` ON `budget_revisions` (`date`);
-- create index "idx_budget_tags_org_budget" to table: "budget_revisions"
CREATE INDEX `idx_budget_tags_org_budget` ON `budget_revisions` (`organization_id`, `budget_id`);
-- create index "idx_budget_revisions_custom_id" to table: "budget_revisions"
CREATE UNIQUE INDEX `idx_budget_revisions_custom_id` ON `budget_revisions` (`custom_id`, `organization_id`, `budget_id`);
-- create index "idx_budget_tags_org_id" to table: "budget_revisions"
CREATE UNIQUE INDEX `idx_budget_tags_org_id` ON `budget_revisions` (`id`, `organization_id`);
-- create "budget_revision_account_values" table
CREATE TABLE `budget_revision_account_values` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `budget_id` uuid NOT NULL,
  `budget_revision_id` uuid NOT NULL,
  `account_id` uuid NOT NULL,
  `value` decimal NOT NULL DEFAULT "0",
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_accounts_budget_revision_account_values` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_budget_revision_account_values_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_budget_revisions_budget_revision_account_values` FOREIGN KEY (`budget_revision_id`) REFERENCES `budget_revisions` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_organizations_budget_revision_account_values` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_budget_revision_account_values_value" to table: "budget_revision_account_values"
CREATE INDEX `idx_budget_revision_account_values_value` ON `budget_revision_account_values` (`value`);
-- create index "idx_budget_tag_account_values_org_tag_account" to table: "budget_revision_account_values"
CREATE UNIQUE INDEX `idx_budget_tag_account_values_org_tag_account` ON `budget_revision_account_values` (`organization_id`, `budget_id`, `budget_revision_id`, `account_id`);
-- create index "idx_budget_revision_account_values_custom_id" to table: "budget_revision_account_values"
CREATE UNIQUE INDEX `idx_budget_revision_account_values_custom_id` ON `budget_revision_account_values` (`custom_id`, `organization_id`, `budget_id`, `budget_revision_id`);
-- create index "idx_budget_tag_account_values_org_id" to table: "budget_revision_account_values"
CREATE UNIQUE INDEX `idx_budget_tag_account_values_org_id` ON `budget_revision_account_values` (`id`, `organization_id`);
-- create "budget_account_values" table
CREATE TABLE `budget_account_values` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `budget_id` uuid NOT NULL,
  `account_id` uuid NOT NULL,
  `value` decimal NOT NULL DEFAULT "0",
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_budget_account_values` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_accounts_budget_account_values` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_budgets_budget_account_values` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_budget_account_values_org_budget_account" to table: "budget_account_values"
CREATE UNIQUE INDEX `idx_budget_account_values_org_budget_account` ON `budget_account_values` (`organization_id`, `budget_id`, `account_id`);
-- create index "idx_budget_account_values_custom_id" to table: "budget_account_values"
CREATE UNIQUE INDEX `idx_budget_account_values_custom_id` ON `budget_account_values` (`custom_id`, `organization_id`, `budget_id`);
-- create index "idx_budget_account_values_org_id" to table: "budget_account_values"
CREATE UNIQUE INDEX `idx_budget_account_values_org_id` ON `budget_account_values` (`id`, `organization_id`);
-- create "ledger_years" table
CREATE TABLE `ledger_years` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `year` integer NOT NULL DEFAULT 0,
  `is_closed` numeric NOT NULL DEFAULT false,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_ledger_years` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_ledger_years_org_year" to table: "ledger_years"
CREATE UNIQUE INDEX `idx_ledger_years_org_year` ON `ledger_years` (`organization_id`, `year`);
-- create index "idx_ledger_years_custom_id" to table: "ledger_years"
CREATE UNIQUE INDEX `idx_ledger_years_custom_id` ON `ledger_years` (`custom_id`, `organization_id`);
-- create index "idx_ledger_years_org_id" to table: "ledger_years"
CREATE UNIQUE INDEX `idx_ledger_years_org_id` ON `ledger_years` (`id`, `organization_id`);
-- create "ledger_accounts" table
CREATE TABLE `ledger_accounts` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `code` varchar NOT NULL,
  `account_type` integer NOT NULL DEFAULT 0,
  `display_name` text NOT NULL DEFAULT '',
  `display_description` text NOT NULL DEFAULT '',
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_ledger_accounts` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_ledger_accounts_display_name" to table: "ledger_accounts"
CREATE INDEX `idx_ledger_accounts_display_name` ON `ledger_accounts` (`display_name`);
-- create index "idx_ledger_accounts_code" to table: "ledger_accounts"
CREATE INDEX `idx_ledger_accounts_code` ON `ledger_accounts` (`code`);
-- create index "idx_ledger_accounts_org_code" to table: "ledger_accounts"
CREATE UNIQUE INDEX `idx_ledger_accounts_org_code` ON `ledger_accounts` (`organization_id`, `code`);
-- create index "idx_ledger_accounts_custom_id" to table: "ledger_accounts"
CREATE UNIQUE INDEX `idx_ledger_accounts_custom_id` ON `ledger_accounts` (`custom_id`, `organization_id`);
-- create index "idx_ledger_accounts_org_id" to table: "ledger_accounts"
CREATE UNIQUE INDEX `idx_ledger_accounts_org_id` ON `ledger_accounts` (`id`, `organization_id`);
-- create "transactions" table
CREATE TABLE `transactions` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `credit_ledger_account_id` uuid NOT NULL,
  `debit_ledger_account_id` uuid NOT NULL,
  `amount` decimal NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `reference` text NOT NULL DEFAULT '',
  `booked_at` date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `document_date` date NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_ledger_accounts_debit_transactions` FOREIGN KEY (`debit_ledger_account_id`) REFERENCES `ledger_accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_ledger_accounts_credit_transactions` FOREIGN KEY (`credit_ledger_account_id`) REFERENCES `ledger_accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_organizations_transactions` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_transactions_unique_entry" to table: "transactions"
CREATE UNIQUE INDEX `idx_transactions_unique_entry` ON `transactions` (`credit_ledger_account_id`, `debit_ledger_account_id`, `amount`, `description`, `reference`, `booked_at`, `document_date`);
-- create index "idx_transactions_custom_id_org" to table: "transactions"
CREATE UNIQUE INDEX `idx_transactions_custom_id_org` ON `transactions` (`custom_id`, `organization_id`);
-- create index "idx_transactions_org_id" to table: "transactions"
CREATE UNIQUE INDEX `idx_transactions_org_id` ON `transactions` (`id`, `organization_id`);
-- create "transaction_assignments" table
CREATE TABLE `transaction_assignments` (
  `id` uuid NULL,
  `organization_id` uuid NOT NULL,
  `transaction_id` uuid NOT NULL,
  `account_id` uuid NOT NULL,
  `value` decimal NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_transaction_assignments` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_accounts_transaction_assignments` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT `fk_transactions_transaction_assignments` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_transaction_assignments_org_id" to table: "transaction_assignments"
CREATE UNIQUE INDEX `idx_transaction_assignments_org_id` ON `transaction_assignments` (`id`, `organization_id`);
-- create "report_templates" table
CREATE TABLE `report_templates` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `display_name` text NOT NULL DEFAULT '',
  `template` text NOT NULL DEFAULT '',
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_report_templates` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_report_templates_custom_id_org" to table: "report_templates"
CREATE UNIQUE INDEX `idx_report_templates_custom_id_org` ON `report_templates` (`custom_id`, `organization_id`);
-- create index "idx_report_templates_org_id" to table: "report_templates"
CREATE UNIQUE INDEX `idx_report_templates_org_id` ON `report_templates` (`id`, `organization_id`);
-- create "reports" table
CREATE TABLE `reports` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `display_name` text NOT NULL DEFAULT '',
  `data` blob NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_reports` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_reports_custom_id_org" to table: "reports"
CREATE UNIQUE INDEX `idx_reports_custom_id_org` ON `reports` (`custom_id`, `organization_id`);
-- create index "idx_reports_org_id" to table: "reports"
CREATE UNIQUE INDEX `idx_reports_org_id` ON `reports` (`id`, `organization_id`);
-- create "users" table
CREATE TABLE `users` (
  `id` uuid NULL,
  `email` text NOT NULL,
  `name` text NOT NULL,
  `picture` text NULL DEFAULT (null),
  `password_hash` text NULL DEFAULT (null),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`)
);
-- create index "idx_users_email" to table: "users"
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`, `email`);
-- create "user_identities" table
CREATE TABLE `user_identities` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `user_id` uuid NOT NULL,
  `provider` text NOT NULL,
  `provider_user_id` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_users_user_identities` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_user_identities_provider_user" to table: "user_identities"
CREATE UNIQUE INDEX `idx_user_identities_provider_user` ON `user_identities` (`provider`, `provider_user_id`);
-- create index "idx_user_identities_provider" to table: "user_identities"
CREATE INDEX `idx_user_identities_provider` ON `user_identities` (`provider`);
-- create index "idx_user_identities_user_id" to table: "user_identities"
CREATE INDEX `idx_user_identities_user_id` ON `user_identities` (`user_id`);
-- create index "idx_user_identities_custom_id" to table: "user_identities"
CREATE UNIQUE INDEX `idx_user_identities_custom_id` ON `user_identities` (`custom_id`, `user_id`);
-- create "user_settings" table
CREATE TABLE `user_settings` (
  `id` uuid NULL,
  `user_id` uuid NOT NULL,
  `locale` text NOT NULL DEFAULT '',
  `theme` text NOT NULL DEFAULT 'system',
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_user_settings_user_id" to table: "user_settings"
CREATE UNIQUE INDEX `idx_user_settings_user_id` ON `user_settings` (`user_id`);
-- create "user_groups" table
CREATE TABLE `user_groups` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `name` text NOT NULL,
  `description` text NOT NULL DEFAULT '',
  `is_system` numeric NOT NULL DEFAULT false,
  `is_default` numeric NOT NULL DEFAULT false,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`)
);
-- create index "idx_user_groups_name" to table: "user_groups"
CREATE INDEX `idx_user_groups_name` ON `user_groups` (`name`);
-- create index "idx_user_groups_custom_id" to table: "user_groups"
CREATE UNIQUE INDEX `idx_user_groups_custom_id` ON `user_groups` (`custom_id`);
-- create "casbin_rule" table
CREATE TABLE `casbin_rule` (
  `id` integer NULL PRIMARY KEY AUTOINCREMENT,
  `ptype` text NOT NULL,
  `v0` text NULL DEFAULT (null),
  `v1` text NULL DEFAULT (null),
  `v2` text NULL DEFAULT (null),
  `v3` text NULL DEFAULT (null),
  `v4` text NULL DEFAULT (null),
  `v5` text NULL DEFAULT (null)
);
-- create index "idx_casbin_rule_v2" to table: "casbin_rule"
CREATE INDEX `idx_casbin_rule_v2` ON `casbin_rule` (`v2`);
-- create index "idx_casbin_rule_v1" to table: "casbin_rule"
CREATE INDEX `idx_casbin_rule_v1` ON `casbin_rule` (`v1`);
-- create index "idx_casbin_rule_v0" to table: "casbin_rule"
CREATE INDEX `idx_casbin_rule_v0` ON `casbin_rule` (`v0`);
-- create index "idx_casbin_rule_ptype" to table: "casbin_rule"
CREATE INDEX `idx_casbin_rule_ptype` ON `casbin_rule` (`ptype`);
-- create "oauth2_clients" table
CREATE TABLE `oauth2_clients` (
  `id` uuid NULL,
  `client_id` text NOT NULL,
  `client_name` text NOT NULL DEFAULT '',
  `client_secret` text NULL DEFAULT (null),
  `redirect_uris` text[] NULL DEFAULT '{}',
  `grant_types` text[] NULL DEFAULT '{}',
  `response_types` text[] NULL DEFAULT '{}',
  `scopes` text[] NULL DEFAULT '{}',
  `token_endpoint_auth_method` text NOT NULL DEFAULT 'none',
  `user_id` uuid NULL DEFAULT (null),
  `public` numeric NOT NULL DEFAULT false,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`)
);
-- create index "idx_oauth2_clients_client_id" to table: "oauth2_clients"
CREATE UNIQUE INDEX `idx_oauth2_clients_client_id` ON `oauth2_clients` (`client_id`);
-- create "oauth2_tokens" table
CREATE TABLE `oauth2_tokens` (
  `id` uuid NULL,
  `signature` text NOT NULL,
  `request_type` text NOT NULL,
  `client_id` text NOT NULL,
  `user_id` uuid NULL DEFAULT (null),
  `scope` text[] NULL DEFAULT '{}',
  `granted_scope` text[] NULL DEFAULT '{}',
  `form_data` text NULL DEFAULT '',
  `session_data` text NULL DEFAULT '',
  `requested_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`)
);
-- create index "idx_oauth2_tokens_user_id" to table: "oauth2_tokens"
CREATE INDEX `idx_oauth2_tokens_user_id` ON `oauth2_tokens` (`user_id`);
-- create index "idx_oauth2_tokens_client_id" to table: "oauth2_tokens"
CREATE INDEX `idx_oauth2_tokens_client_id` ON `oauth2_tokens` (`client_id`);
-- create index "idx_oauth2_tokens_request_type" to table: "oauth2_tokens"
CREATE INDEX `idx_oauth2_tokens_request_type` ON `oauth2_tokens` (`request_type`);
-- create index "idx_oauth2_tokens_signature_type" to table: "oauth2_tokens"
CREATE UNIQUE INDEX `idx_oauth2_tokens_signature_type` ON `oauth2_tokens` (`signature`, `request_type`);
-- create "auth_sessions" table
CREATE TABLE `auth_sessions` (
  `id` uuid NULL,
  `token` text NOT NULL,
  `user_id` uuid NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`)
);
-- create index "idx_auth_sessions_user_id" to table: "auth_sessions"
CREATE INDEX `idx_auth_sessions_user_id` ON `auth_sessions` (`user_id`);
-- create index "idx_auth_sessions_token" to table: "auth_sessions"
CREATE UNIQUE INDEX `idx_auth_sessions_token` ON `auth_sessions` (`token`);
