-- reverse: modify "transactions" table
ALTER TABLE "public"."transactions" ADD COLUMN "custom_id" text NOT NULL DEFAULT '';
-- reverse: create index "idx_accounts_is_group" to table: "accounts"
DROP INDEX "public"."idx_accounts_is_group";
-- reverse: modify "accounts" table
ALTER TABLE "public"."accounts" DROP COLUMN "is_group";
