-- consolidate duplicate transaction_assignments rows sharing the same
-- (transaction_id, account_id) pair into a single row before the unique
-- index below is created. For each duplicate group, the corrected row
-- keeps the identity of the oldest row (by created_at, then id) and its
-- value is the sum of all rows in the group.
CREATE TEMPORARY TABLE "transaction_assignments_corrected" AS
SELECT
  (ARRAY_AGG("id" ORDER BY "created_at" ASC, "id" ASC))[1] AS "id",
  (ARRAY_AGG("organization_id" ORDER BY "created_at" ASC, "id" ASC))[1] AS "organization_id",
  "transaction_id",
  "account_id",
  SUM("value") AS "value",
  (ARRAY_AGG("created_at" ORDER BY "created_at" ASC, "id" ASC))[1] AS "created_at",
  (ARRAY_AGG("updated_at" ORDER BY "created_at" ASC, "id" ASC))[1] AS "updated_at"
FROM "public"."transaction_assignments"
GROUP BY "transaction_id", "account_id";
-- remove all existing entries...
DELETE FROM "public"."transaction_assignments";
-- ...and re-insert the corrected, deduplicated entries
INSERT INTO "public"."transaction_assignments" ("id", "organization_id", "transaction_id", "account_id", "value", "created_at", "updated_at")
SELECT "id", "organization_id", "transaction_id", "account_id", "value", "created_at", "updated_at"
FROM "transaction_assignments_corrected";
DROP TABLE "transaction_assignments_corrected";
-- create index "idx_transaction_assignments_transaction_account" to table: "transaction_assignments"
CREATE UNIQUE INDEX "idx_transaction_assignments_transaction_account" ON "public"."transaction_assignments" ("transaction_id", "account_id");
