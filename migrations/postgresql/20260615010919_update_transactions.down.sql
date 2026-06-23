-- reverse: drop "import_sources" table
CREATE TABLE "public"."import_sources" (
  "id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "period_start" date NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "custom_id" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_organizations_import_sources" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE UNIQUE INDEX "idx_import_sources_custom_id_org" ON "public"."import_sources" ("custom_id", "organization_id");
CREATE UNIQUE INDEX "idx_import_sources_org_id" ON "public"."import_sources" ("id", "organization_id");
-- reverse: drop "transaction_accounts" table
CREATE TABLE "public"."transaction_accounts" (
  "id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "code" character varying(64) NOT NULL,
  "import_source_id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "custom_id" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_import_sources_transaction_accounts" FOREIGN KEY ("import_source_id") REFERENCES "public"."import_sources" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_organizations_transaction_accounts" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE INDEX "idx_transaction_accounts_code" ON "public"."transaction_accounts" ("code");
CREATE UNIQUE INDEX "idx_transaction_accounts_custom_id_org" ON "public"."transaction_accounts" ("custom_id", "organization_id");
CREATE INDEX "idx_transaction_accounts_display_name" ON "public"."transaction_accounts" ("display_name");
CREATE UNIQUE INDEX "idx_transaction_accounts_org_code_source" ON "public"."transaction_accounts" ("organization_id", "code", "import_source_id");
CREATE UNIQUE INDEX "idx_transaction_accounts_org_id" ON "public"."transaction_accounts" ("id", "organization_id");
-- reverse: drop "transaction_account_assignments" table
CREATE TABLE "public"."transaction_account_assignments" (
  "id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "transaction_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "value" numeric NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "custom_id" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_accounts_transaction_account_assignments" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_organizations_transaction_account_assignments" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_transactions_transaction_account_assignments" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE UNIQUE INDEX "idx_transaction_account_assignments_custom_id" ON "public"."transaction_account_assignments" ("custom_id", "organization_id", "transaction_id");
CREATE UNIQUE INDEX "idx_transaction_account_assignments_org_id" ON "public"."transaction_account_assignments" ("id", "organization_id");
CREATE UNIQUE INDEX "idx_transaction_account_assignments_org_trans_account" ON "public"."transaction_account_assignments" ("organization_id", "transaction_id", "account_id");
-- reverse: drop "import_source_periods" table
CREATE TABLE "public"."import_source_periods" (
  "id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "import_source_id" uuid NOT NULL,
  "year" bigint NOT NULL DEFAULT 0,
  "is_closed" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "custom_id" text NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_import_sources_import_source_periods" FOREIGN KEY ("import_source_id") REFERENCES "public"."import_sources" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_organizations_import_source_periods" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE UNIQUE INDEX "idx_import_source_periods_custom_id" ON "public"."import_source_periods" ("custom_id", "organization_id", "import_source_id");
CREATE UNIQUE INDEX "idx_import_source_periods_org_id" ON "public"."import_source_periods" ("id", "organization_id");
CREATE UNIQUE INDEX "idx_import_source_periods_org_source" ON "public"."import_source_periods" ("organization_id", "import_source_id", "year");
-- reverse: create index "idx_transaction_assignments_org_id" to table: "transaction_assignments"
DROP INDEX "public"."idx_transaction_assignments_org_id";
-- reverse: create index "idx_transaction_assignments_custom_id" to table: "transaction_assignments"
DROP INDEX "public"."idx_transaction_assignments_custom_id";
-- reverse: create "transaction_assignments" table
DROP TABLE "public"."transaction_assignments";
-- reverse: create index "idx_ledger_years_org_year" to table: "ledger_years"
DROP INDEX "public"."idx_ledger_years_org_year";
-- reverse: create index "idx_ledger_years_org_id" to table: "ledger_years"
DROP INDEX "public"."idx_ledger_years_org_id";
-- reverse: create index "idx_ledger_years_custom_id" to table: "ledger_years"
DROP INDEX "public"."idx_ledger_years_custom_id";
-- reverse: create "ledger_years" table
DROP TABLE "public"."ledger_years";
-- reverse: modify "transactions" table
ALTER TABLE "public"."transactions" DROP CONSTRAINT "fk_ledger_accounts_debit_transactions", DROP CONSTRAINT "fk_ledger_accounts_credit_transactions", ADD CONSTRAINT "fk_transaction_accounts_debit_transactions" FOREIGN KEY ("debit_transaction_account_id") REFERENCES "public"."transaction_accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "fk_transaction_accounts_credit_transactions" FOREIGN KEY ("credit_transaction_account_id") REFERENCES "public"."transaction_accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- reverse: rename a column from "debit_transaction_account_id" to "debit_ledger_account_id"
ALTER TABLE "public"."transactions" RENAME COLUMN "debit_ledger_account_id" TO "debit_transaction_account_id";
-- reverse: rename a column from "credit_transaction_account_id" to "credit_ledger_account_id"
ALTER TABLE "public"."transactions" RENAME COLUMN "credit_ledger_account_id" TO "credit_transaction_account_id";
-- reverse: create index "idx_ledger_accounts_org_id" to table: "ledger_accounts"
DROP INDEX "public"."idx_ledger_accounts_org_id";
-- reverse: create index "idx_ledger_accounts_org_code" to table: "ledger_accounts"
DROP INDEX "public"."idx_ledger_accounts_org_code";
-- reverse: create index "idx_ledger_accounts_display_name" to table: "ledger_accounts"
DROP INDEX "public"."idx_ledger_accounts_display_name";
-- reverse: create index "idx_ledger_accounts_custom_id" to table: "ledger_accounts"
DROP INDEX "public"."idx_ledger_accounts_custom_id";
-- reverse: create index "idx_ledger_accounts_code" to table: "ledger_accounts"
DROP INDEX "public"."idx_ledger_accounts_code";
-- reverse: create "ledger_accounts" table
DROP TABLE "public"."ledger_accounts";
-- reverse: modify "organizations" table
ALTER TABLE "public"."organizations" DROP COLUMN "start_month";
