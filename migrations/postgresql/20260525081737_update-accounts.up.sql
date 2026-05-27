-- modify "accounts" table
ALTER TABLE "public"."accounts" ADD COLUMN "is_group" boolean NOT NULL DEFAULT false;
-- create index "idx_accounts_is_group" to table: "accounts"
CREATE INDEX "idx_accounts_is_group" ON "public"."accounts" ("is_group");
-- modify "transactions" table
ALTER TABLE "public"."transactions" DROP COLUMN "custom_id";
