-- reverse: drop index "idx_transaction_assignments_custom_id" from table: "transaction_assignments"
CREATE UNIQUE INDEX "idx_transaction_assignments_custom_id" ON "public"."transaction_assignments" ("organization_id");
