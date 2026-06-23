-- modify "organizations" table
ALTER TABLE "public"."organizations" ADD COLUMN "start_month" bigint NOT NULL DEFAULT 1;
-- create "ledger_accounts" table
CREATE TABLE "public"."ledger_accounts" (
  "id" uuid NOT NULL,
  "custom_id" text NULL,
  "organization_id" uuid NOT NULL,
  "code" character varying(64) NOT NULL,
  "account_type" bigint NOT NULL DEFAULT 0,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_organizations_ledger_accounts" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_ledger_accounts_code" to table: "ledger_accounts"
CREATE INDEX "idx_ledger_accounts_code" ON "public"."ledger_accounts" ("code");
-- create index "idx_ledger_accounts_custom_id" to table: "ledger_accounts"
CREATE UNIQUE INDEX "idx_ledger_accounts_custom_id" ON "public"."ledger_accounts" ("custom_id", "organization_id");
-- create index "idx_ledger_accounts_display_name" to table: "ledger_accounts"
CREATE INDEX "idx_ledger_accounts_display_name" ON "public"."ledger_accounts" ("display_name");
-- create index "idx_ledger_accounts_org_code" to table: "ledger_accounts"
CREATE UNIQUE INDEX "idx_ledger_accounts_org_code" ON "public"."ledger_accounts" ("organization_id", "code");
-- create index "idx_ledger_accounts_org_id" to table: "ledger_accounts"
CREATE UNIQUE INDEX "idx_ledger_accounts_org_id" ON "public"."ledger_accounts" ("id", "organization_id");
-- rename a column from "credit_transaction_account_id" to "credit_ledger_account_id"
ALTER TABLE "public"."transactions" RENAME COLUMN "credit_transaction_account_id" TO "credit_ledger_account_id";
-- rename a column from "debit_transaction_account_id" to "debit_ledger_account_id"
ALTER TABLE "public"."transactions" RENAME COLUMN "debit_transaction_account_id" TO "debit_ledger_account_id";
-- modify "transactions" table
ALTER TABLE "public"."transactions" DROP CONSTRAINT "fk_transaction_accounts_credit_transactions", DROP CONSTRAINT "fk_transaction_accounts_debit_transactions", ADD CONSTRAINT "fk_ledger_accounts_credit_transactions" FOREIGN KEY ("credit_ledger_account_id") REFERENCES "public"."ledger_accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION, ADD CONSTRAINT "fk_ledger_accounts_debit_transactions" FOREIGN KEY ("debit_ledger_account_id") REFERENCES "public"."ledger_accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION;
-- create "ledger_years" table
CREATE TABLE "public"."ledger_years" (
  "id" uuid NOT NULL,
  "custom_id" text NULL,
  "organization_id" uuid NOT NULL,
  "year" bigint NOT NULL DEFAULT 0,
  "is_closed" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_organizations_ledger_years" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_ledger_years_custom_id" to table: "ledger_years"
CREATE UNIQUE INDEX "idx_ledger_years_custom_id" ON "public"."ledger_years" ("custom_id", "organization_id");
-- create index "idx_ledger_years_org_id" to table: "ledger_years"
CREATE UNIQUE INDEX "idx_ledger_years_org_id" ON "public"."ledger_years" ("id", "organization_id");
-- create index "idx_ledger_years_org_year" to table: "ledger_years"
CREATE UNIQUE INDEX "idx_ledger_years_org_year" ON "public"."ledger_years" ("year");
-- create "transaction_assignments" table
CREATE TABLE "public"."transaction_assignments" (
  "id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "transaction_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "value" numeric NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_accounts_transaction_assignments" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_organizations_transaction_assignments" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_transactions_transaction_assignments" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_transaction_assignments_custom_id" to table: "transaction_assignments"
CREATE UNIQUE INDEX "idx_transaction_assignments_custom_id" ON "public"."transaction_assignments" ("organization_id");
-- create index "idx_transaction_assignments_org_id" to table: "transaction_assignments"
CREATE UNIQUE INDEX "idx_transaction_assignments_org_id" ON "public"."transaction_assignments" ("id", "organization_id");
-- drop "import_source_periods" table
DROP TABLE "public"."import_source_periods";
-- drop "transaction_account_assignments" table
DROP TABLE "public"."transaction_account_assignments";
-- drop "transaction_accounts" table
DROP TABLE "public"."transaction_accounts";
-- drop "import_sources" table
DROP TABLE "public"."import_sources";
