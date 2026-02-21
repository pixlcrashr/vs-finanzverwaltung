-- create "user_groups" table
CREATE TABLE "public"."user_groups" (
  "id" text NOT NULL,
  "name" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "is_system" boolean NOT NULL DEFAULT false,
  "is_default" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_user_groups_name" to table: "user_groups"
CREATE INDEX "idx_user_groups_name" ON "public"."user_groups" ("name");
-- create "settings" table
CREATE TABLE "public"."settings" (
  "id" text NOT NULL,
  "type" character varying(16) NOT NULL,
  "value_float" numeric NULL,
  "value_int" bigint NULL,
  "value_text" text NULL,
  "value_bool" boolean NULL,
  "value_decimal" numeric NULL,
  "value_uuid" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_settings_type" to table: "settings"
CREATE INDEX "idx_settings_type" ON "public"."settings" ("type");
-- create "report_templates" table
CREATE TABLE "public"."report_templates" (
  "id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "template" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create "reports" table
CREATE TABLE "public"."reports" (
  "id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "data" bytea NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create "account_groups" table
CREATE TABLE "public"."account_groups" (
  "id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create "casbin_rule" table
CREATE TABLE "public"."casbin_rule" (
  "id" uuid NOT NULL,
  "ptype" text NOT NULL,
  "v0" text NULL,
  "v1" text NULL,
  "v2" text NULL,
  "v3" text NULL,
  "v4" text NULL,
  "v5" text NULL,
  PRIMARY KEY ("id")
);
-- create index "idx_casbin_rule_ptype" to table: "casbin_rule"
CREATE INDEX "idx_casbin_rule_ptype" ON "public"."casbin_rule" ("ptype");
-- create index "idx_casbin_rule_v0" to table: "casbin_rule"
CREATE INDEX "idx_casbin_rule_v0" ON "public"."casbin_rule" ("v0");
-- create index "idx_casbin_rule_v1" to table: "casbin_rule"
CREATE INDEX "idx_casbin_rule_v1" ON "public"."casbin_rule" ("v1");
-- create index "idx_casbin_rule_v2" to table: "casbin_rule"
CREATE INDEX "idx_casbin_rule_v2" ON "public"."casbin_rule" ("v2");
-- create "accounts" table
CREATE TABLE "public"."accounts" (
  "id" uuid NOT NULL,
  "parent_account_id" uuid NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_code" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "is_archived" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_accounts_child_accounts" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_accounts_display_code" to table: "accounts"
CREATE INDEX "idx_accounts_display_code" ON "public"."accounts" ("display_code");
-- create index "idx_accounts_display_name" to table: "accounts"
CREATE INDEX "idx_accounts_display_name" ON "public"."accounts" ("display_name");
-- create index "idx_accounts_parent_account_id" to table: "accounts"
CREATE INDEX "idx_accounts_parent_account_id" ON "public"."accounts" ("parent_account_id");
-- create "account_group_assignments" table
CREATE TABLE "public"."account_group_assignments" (
  "id" uuid NOT NULL,
  "account_group_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "negate" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_account_groups_account_group_assignments" FOREIGN KEY ("account_group_id") REFERENCES "public"."account_groups" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_accounts_account_group_assignments" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_account_group_assignments_negate" to table: "account_group_assignments"
CREATE INDEX "idx_account_group_assignments_negate" ON "public"."account_group_assignments" ("negate");
-- create index "idx_account_group_id_account_id" to table: "account_group_assignments"
CREATE UNIQUE INDEX "idx_account_group_id_account_id" ON "public"."account_group_assignments" ("account_group_id", "account_id");
-- create "budgets" table
CREATE TABLE "public"."budgets" (
  "id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "is_closed" boolean NOT NULL DEFAULT false,
  "period_start" timestamptz NOT NULL,
  "period_end" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_budgets_display_name" to table: "budgets"
CREATE INDEX "idx_budgets_display_name" ON "public"."budgets" ("display_name");
-- create "budget_revisions" table
CREATE TABLE "public"."budget_revisions" (
  "id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "date" timestamptz NOT NULL,
  "display_description" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_budgets_budget_revisions" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_budget_revisions_budget_id" to table: "budget_revisions"
CREATE INDEX "idx_budget_revisions_budget_id" ON "public"."budget_revisions" ("budget_id");
-- create index "idx_budget_revisions_date" to table: "budget_revisions"
CREATE INDEX "idx_budget_revisions_date" ON "public"."budget_revisions" ("date");
-- create "budget_revision_account_values" table
CREATE TABLE "public"."budget_revision_account_values" (
  "id" uuid NOT NULL,
  "budget_revision_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "value" numeric NOT NULL DEFAULT 0,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_accounts_budget_revision_account_values" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_budget_revisions_budget_revision_account_values" FOREIGN KEY ("budget_revision_id") REFERENCES "public"."budget_revisions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_budget_revision_account_values_account_id" to table: "budget_revision_account_values"
CREATE INDEX "idx_budget_revision_account_values_account_id" ON "public"."budget_revision_account_values" ("account_id");
-- create index "idx_budget_revision_account_values_budget_id" to table: "budget_revision_account_values"
CREATE INDEX "idx_budget_revision_account_values_budget_id" ON "public"."budget_revision_account_values" ("budget_revision_id");
-- create index "idx_budget_revision_account_values_value" to table: "budget_revision_account_values"
CREATE INDEX "idx_budget_revision_account_values_value" ON "public"."budget_revision_account_values" ("value");
-- create "import_sources" table
CREATE TABLE "public"."import_sources" (
  "id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "period_start" date NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create "import_source_periods" table
CREATE TABLE "public"."import_source_periods" (
  "id" uuid NOT NULL,
  "import_source_id" uuid NOT NULL,
  "year" bigint NOT NULL DEFAULT 0,
  "is_closed" boolean NOT NULL DEFAULT false,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_import_sources_import_source_periods" FOREIGN KEY ("import_source_id") REFERENCES "public"."import_sources" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_import_source_periods_source_year" to table: "import_source_periods"
CREATE UNIQUE INDEX "idx_import_source_periods_source_year" ON "public"."import_source_periods" ("import_source_id", "year");
-- create "transaction_accounts" table
CREATE TABLE "public"."transaction_accounts" (
  "id" uuid NOT NULL,
  "code" character varying(64) NOT NULL,
  "import_source_id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_import_sources_transaction_accounts" FOREIGN KEY ("import_source_id") REFERENCES "public"."import_sources" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_transaction_accounts_code" to table: "transaction_accounts"
CREATE INDEX "idx_transaction_accounts_code" ON "public"."transaction_accounts" ("code");
-- create index "idx_transaction_accounts_code_source" to table: "transaction_accounts"
CREATE UNIQUE INDEX "idx_transaction_accounts_code_source" ON "public"."transaction_accounts" ("code", "import_source_id");
-- create index "idx_transaction_accounts_display_name" to table: "transaction_accounts"
CREATE INDEX "idx_transaction_accounts_display_name" ON "public"."transaction_accounts" ("display_name");
-- create "transactions" table
CREATE TABLE "public"."transactions" (
  "id" uuid NOT NULL,
  "credit_transaction_account_id" uuid NOT NULL,
  "debit_transaction_account_id" uuid NOT NULL,
  "amount" numeric NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "reference" text NOT NULL DEFAULT '',
  "assigned_account_id" uuid NULL,
  "booked_at" date NOT NULL DEFAULT now(),
  "document_date" date NOT NULL DEFAULT now(),
  "custom_id" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_transaction_accounts_credit_transactions" FOREIGN KEY ("credit_transaction_account_id") REFERENCES "public"."transaction_accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_transaction_accounts_debit_transactions" FOREIGN KEY ("debit_transaction_account_id") REFERENCES "public"."transaction_accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_transactions_assigned_account" FOREIGN KEY ("assigned_account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_transactions_custom_id" to table: "transactions"
CREATE UNIQUE INDEX "idx_transactions_custom_id" ON "public"."transactions" ("custom_id");
-- create index "idx_transactions_unique_entry" to table: "transactions"
CREATE UNIQUE INDEX "idx_transactions_unique_entry" ON "public"."transactions" ("credit_transaction_account_id", "debit_transaction_account_id", "amount", "description", "reference", "booked_at", "document_date");
-- create "transaction_account_assignments" table
CREATE TABLE "public"."transaction_account_assignments" (
  "id" uuid NOT NULL,
  "transaction_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "value" numeric NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_accounts_transaction_account_assignments" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_transactions_transaction_account_assignments" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_transaction_account_assignments_account_id" to table: "transaction_account_assignments"
CREATE INDEX "idx_transaction_account_assignments_account_id" ON "public"."transaction_account_assignments" ("account_id");
-- create index "idx_transaction_account_assignments_transaction_id" to table: "transaction_account_assignments"
CREATE INDEX "idx_transaction_account_assignments_transaction_id" ON "public"."transaction_account_assignments" ("transaction_id");
-- create "users" table
CREATE TABLE "public"."users" (
  "id" uuid NOT NULL,
  "email" text NOT NULL,
  "name" text NOT NULL,
  "picture" text NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_users_email" to table: "users"
CREATE UNIQUE INDEX "idx_users_email" ON "public"."users" ("email", "email");
-- create "user_identities" table
CREATE TABLE "public"."user_identities" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "provider" text NOT NULL,
  "provider_user_id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_users_user_identities" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_user_identities_provider" to table: "user_identities"
CREATE INDEX "idx_user_identities_provider" ON "public"."user_identities" ("provider");
-- create index "idx_user_identities_provider_user" to table: "user_identities"
CREATE UNIQUE INDEX "idx_user_identities_provider_user" ON "public"."user_identities" ("provider", "provider_user_id");
-- create index "idx_user_identities_user_id" to table: "user_identities"
CREATE INDEX "idx_user_identities_user_id" ON "public"."user_identities" ("user_id");
-- create "views" table
CREATE TABLE "public"."views" (
  "id" uuid NOT NULL,
  "display_name" text NOT NULL DEFAULT '',
  "display_description" text NOT NULL DEFAULT '',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_views_display_description" to table: "views"
CREATE INDEX "idx_views_display_description" ON "public"."views" ("display_description");
-- create index "idx_views_display_name" to table: "views"
CREATE INDEX "idx_views_display_name" ON "public"."views" ("display_name");
-- create "view_account_assignments" table
CREATE TABLE "public"."view_account_assignments" (
  "id" uuid NOT NULL,
  "view_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_accounts_view_account_assignments" FOREIGN KEY ("account_id") REFERENCES "public"."accounts" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_views_view_account_assignments" FOREIGN KEY ("view_id") REFERENCES "public"."views" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_view_account_assignments_account_id" to table: "view_account_assignments"
CREATE INDEX "idx_view_account_assignments_account_id" ON "public"."view_account_assignments" ("account_id");
-- create index "idx_view_account_assignments_unique" to table: "view_account_assignments"
CREATE UNIQUE INDEX "idx_view_account_assignments_unique" ON "public"."view_account_assignments" ("view_id", "account_id");
-- create index "idx_view_account_assignments_view_id" to table: "view_account_assignments"
CREATE INDEX "idx_view_account_assignments_view_id" ON "public"."view_account_assignments" ("view_id");
-- create "view_account_group_assignments" table
CREATE TABLE "public"."view_account_group_assignments" (
  "id" uuid NOT NULL,
  "view_id" uuid NOT NULL,
  "account_group_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_account_groups_view_account_group_assignments" FOREIGN KEY ("account_group_id") REFERENCES "public"."account_groups" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_views_view_account_group_assignments" FOREIGN KEY ("view_id") REFERENCES "public"."views" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_view_account_group_assignments_account_group_id" to table: "view_account_group_assignments"
CREATE INDEX "idx_view_account_group_assignments_account_group_id" ON "public"."view_account_group_assignments" ("account_group_id");
-- create index "idx_view_account_group_assignments_unique" to table: "view_account_group_assignments"
CREATE UNIQUE INDEX "idx_view_account_group_assignments_unique" ON "public"."view_account_group_assignments" ("view_id", "account_group_id");
-- create index "idx_view_account_group_assignments_view_id" to table: "view_account_group_assignments"
CREATE INDEX "idx_view_account_group_assignments_view_id" ON "public"."view_account_group_assignments" ("view_id");
-- create "view_budget_assignments" table
CREATE TABLE "public"."view_budget_assignments" (
  "id" uuid NOT NULL,
  "view_id" uuid NOT NULL,
  "budget_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_budgets_view_budget_assignments" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_views_view_budget_assignments" FOREIGN KEY ("view_id") REFERENCES "public"."views" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_view_budget_assignments_budget_id" to table: "view_budget_assignments"
CREATE INDEX "idx_view_budget_assignments_budget_id" ON "public"."view_budget_assignments" ("budget_id");
-- create index "idx_view_budget_assignments_unique" to table: "view_budget_assignments"
CREATE UNIQUE INDEX "idx_view_budget_assignments_unique" ON "public"."view_budget_assignments" ("view_id", "budget_id");
-- create index "idx_view_budget_assignments_view_id" to table: "view_budget_assignments"
CREATE INDEX "idx_view_budget_assignments_view_id" ON "public"."view_budget_assignments" ("view_id");
