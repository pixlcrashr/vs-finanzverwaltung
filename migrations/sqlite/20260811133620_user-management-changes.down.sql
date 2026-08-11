-- reverse: add column "email_notifications" to table: "user_settings"
ALTER TABLE `user_settings` DROP COLUMN `email_notifications`;
-- reverse: add column "is_published" to table: "budget_revisions"
ALTER TABLE `budget_revisions` DROP COLUMN `is_published`;
-- reverse: create index "idx_budgets_org_id" to table: "budgets"
DROP INDEX `idx_budgets_org_id`;
-- reverse: create index "idx_budgets_custom_id_org" to table: "budgets"
DROP INDEX `idx_budgets_custom_id_org`;
-- reverse: create index "idx_budgets_display_name" to table: "budgets"
DROP INDEX `idx_budgets_display_name`;
-- reverse: create "new_budgets" table
DROP TABLE `new_budgets`;
-- reverse: add column "display_description" to table: "organizations"
ALTER TABLE `organizations` DROP COLUMN `display_description`;
