-- modify "account_group_assignments" table
ALTER TABLE "public"."account_group_assignments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "account_groups" table
ALTER TABLE "public"."account_groups" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "accounts" table
ALTER TABLE "public"."accounts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "auth_sessions" table
ALTER TABLE "public"."auth_sessions" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "budget_account_values" table
ALTER TABLE "public"."budget_account_values" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "budget_revision_account_values" table
ALTER TABLE "public"."budget_revision_account_values" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "budget_revisions" table
ALTER TABLE "public"."budget_revisions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "budgets" table
ALTER TABLE "public"."budgets" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "ledger_accounts" table
ALTER TABLE "public"."ledger_accounts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "ledger_years" table
ALTER TABLE "public"."ledger_years" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "oauth2_clients" table
ALTER TABLE "public"."oauth2_clients" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "oauth2_tokens" table
ALTER TABLE "public"."oauth2_tokens" ALTER COLUMN "requested_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "organizations" table
ALTER TABLE "public"."organizations" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "report_templates" table
ALTER TABLE "public"."report_templates" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "reports" table
ALTER TABLE "public"."reports" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "transaction_assignments" table
ALTER TABLE "public"."transaction_assignments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "transactions" table
ALTER TABLE "public"."transactions" ALTER COLUMN "booked_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "document_date" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "user_groups" table
ALTER TABLE "public"."user_groups" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "user_identities" table
ALTER TABLE "public"."user_identities" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "user_settings" table
ALTER TABLE "public"."user_settings" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
-- modify "users" table
ALTER TABLE "public"."users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP, ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
