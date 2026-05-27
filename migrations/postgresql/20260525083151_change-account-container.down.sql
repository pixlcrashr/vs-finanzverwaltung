-- reverse: create index "idx_accounts_is_container" to table: "accounts"
DROP INDEX "public"."idx_accounts_is_container";
-- reverse: rename a column from "is_group" to "is_container"
ALTER TABLE "public"."accounts" RENAME COLUMN "is_container" TO "is_group";
-- reverse: drop index "idx_accounts_is_group" from table: "accounts"
CREATE INDEX "idx_accounts_is_group" ON "public"."accounts" ("is_group");
