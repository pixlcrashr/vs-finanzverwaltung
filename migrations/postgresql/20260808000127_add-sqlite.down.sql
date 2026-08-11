-- reverse: modify "users" table
ALTER TABLE "public"."users" ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "created_at" SET DEFAULT now();
-- reverse: modify "user_settings" table
ALTER TABLE "public"."user_settings" ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "user_identities" table
ALTER TABLE "public"."user_identities" ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "created_at" SET DEFAULT now();
-- reverse: modify "user_groups" table
ALTER TABLE "public"."user_groups" ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "created_at" SET DEFAULT now();
-- reverse: modify "transactions" table
ALTER TABLE "public"."transactions" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "document_date" SET DEFAULT now(), ALTER COLUMN "booked_at" SET DEFAULT now();
-- reverse: modify "transaction_assignments" table
ALTER TABLE "public"."transaction_assignments" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "reports" table
ALTER TABLE "public"."reports" ALTER COLUMN "created_at" SET DEFAULT now();
-- reverse: modify "report_templates" table
ALTER TABLE "public"."report_templates" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "organizations" table
ALTER TABLE "public"."organizations" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "oauth2_tokens" table
ALTER TABLE "public"."oauth2_tokens" ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "requested_at" SET DEFAULT now();
-- reverse: modify "oauth2_clients" table
ALTER TABLE "public"."oauth2_clients" ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "created_at" SET DEFAULT now();
-- reverse: modify "ledger_years" table
ALTER TABLE "public"."ledger_years" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "ledger_accounts" table
ALTER TABLE "public"."ledger_accounts" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "budgets" table
ALTER TABLE "public"."budgets" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "budget_revisions" table
ALTER TABLE "public"."budget_revisions" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "budget_revision_account_values" table
ALTER TABLE "public"."budget_revision_account_values" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "budget_account_values" table
ALTER TABLE "public"."budget_account_values" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "auth_sessions" table
ALTER TABLE "public"."auth_sessions" ALTER COLUMN "updated_at" SET DEFAULT now(), ALTER COLUMN "created_at" SET DEFAULT now();
-- reverse: modify "accounts" table
ALTER TABLE "public"."accounts" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "account_groups" table
ALTER TABLE "public"."account_groups" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
-- reverse: modify "account_group_assignments" table
ALTER TABLE "public"."account_group_assignments" ALTER COLUMN "created_at" SET DEFAULT now(), ALTER COLUMN "updated_at" SET DEFAULT now();
