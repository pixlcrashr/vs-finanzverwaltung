-- disable the enforcement of foreign-keys constraints
PRAGMA foreign_keys = off;
-- add column "display_description" to table: "organizations"
ALTER TABLE `organizations` ADD COLUMN `display_description` text NOT NULL DEFAULT '';
-- create "new_budgets" table
CREATE TABLE `new_budgets` (
  `id` uuid NULL,
  `custom_id` text NULL,
  `organization_id` uuid NOT NULL,
  `display_name` text NOT NULL DEFAULT '',
  `display_description` text NOT NULL DEFAULT '',
  `is_closed` numeric NOT NULL DEFAULT false,
  `is_published` numeric NOT NULL DEFAULT false,
  `publish_actual_values` numeric NOT NULL DEFAULT false,
  `publish_actual_values_until` datetime NULL DEFAULT (null),
  `period_start` datetime NOT NULL,
  `period_end` datetime NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  `created_at` datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_organizations_budgets` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- copy rows from old table "budgets" to new temporary table "new_budgets"
INSERT INTO `new_budgets` (`id`, `custom_id`, `organization_id`, `display_name`, `display_description`, `is_closed`, `period_start`, `period_end`, `updated_at`, `created_at`) SELECT `id`, `custom_id`, `organization_id`, `display_name`, `display_description`, `is_closed`, `period_start`, `period_end`, `updated_at`, `created_at` FROM `budgets`;
-- drop "budgets" table after copying rows
DROP TABLE `budgets`;
-- rename temporary table "new_budgets" to "budgets"
ALTER TABLE `new_budgets` RENAME TO `budgets`;
-- create index "idx_budgets_display_name" to table: "budgets"
CREATE INDEX `idx_budgets_display_name` ON `budgets` (`display_name`);
-- create index "idx_budgets_custom_id_org" to table: "budgets"
CREATE UNIQUE INDEX `idx_budgets_custom_id_org` ON `budgets` (`custom_id`, `organization_id`);
-- create index "idx_budgets_org_id" to table: "budgets"
CREATE UNIQUE INDEX `idx_budgets_org_id` ON `budgets` (`id`, `organization_id`);
-- add column "is_published" to table: "budget_revisions"
ALTER TABLE `budget_revisions` ADD COLUMN `is_published` numeric NOT NULL DEFAULT false;
-- add column "email_notifications" to table: "user_settings"
ALTER TABLE `user_settings` ADD COLUMN `email_notifications` numeric NOT NULL DEFAULT false;
-- enable back the enforcement of foreign-keys constraints
PRAGMA foreign_keys = on;
