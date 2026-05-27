-- drop index "idx_accounts_is_group" from table: "accounts"
DROP INDEX "public"."idx_accounts_is_group";
-- rename a column from "is_group" to "is_container"
ALTER TABLE "public"."accounts" RENAME COLUMN "is_group" TO "is_container";
-- create index "idx_accounts_is_container" to table: "accounts"
CREATE INDEX "idx_accounts_is_container" ON "public"."accounts" ("is_container");
