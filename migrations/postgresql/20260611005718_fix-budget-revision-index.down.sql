-- reverse: create index "idx_budget_tags_org_budget" to table: "budget_revisions"
DROP INDEX "public"."idx_budget_tags_org_budget";
-- reverse: drop index "idx_budget_tags_org_budget" from table: "budget_revisions"
CREATE UNIQUE INDEX "idx_budget_tags_org_budget" ON "public"."budget_revisions" ("organization_id", "budget_id");
