-- consolidate duplicate transaction_assignments rows sharing the same
-- (transaction_id, account_id) pair into a single row before the unique
-- index below is created. For each duplicate group, the corrected row
-- keeps the identity of the oldest row (by created_at, then id) and its
-- value is the sum of all rows in the group.
CREATE TEMPORARY TABLE `transaction_assignments_corrected` AS
SELECT
  `keeper`.`id` AS `id`,
  `keeper`.`organization_id` AS `organization_id`,
  `keeper`.`transaction_id` AS `transaction_id`,
  `keeper`.`account_id` AS `account_id`,
  `totals`.`value` AS `value`,
  `keeper`.`created_at` AS `created_at`,
  `keeper`.`updated_at` AS `updated_at`
FROM (
  SELECT `id`, `organization_id`, `transaction_id`, `account_id`, `created_at`, `updated_at`,
    ROW_NUMBER() OVER (
      PARTITION BY `transaction_id`, `account_id`
      ORDER BY `created_at` ASC, `id` ASC
    ) AS `rn`
  FROM `transaction_assignments`
) AS `keeper`
JOIN (
  SELECT `transaction_id`, `account_id`, SUM(`value`) AS `value`
  FROM `transaction_assignments`
  GROUP BY `transaction_id`, `account_id`
) AS `totals`
  ON `totals`.`transaction_id` = `keeper`.`transaction_id`
  AND `totals`.`account_id` = `keeper`.`account_id`
WHERE `keeper`.`rn` = 1;
-- remove all existing entries...
DELETE FROM `transaction_assignments`;
-- ...and re-insert the corrected, deduplicated entries
INSERT INTO `transaction_assignments` (`id`, `organization_id`, `transaction_id`, `account_id`, `value`, `created_at`, `updated_at`)
SELECT `id`, `organization_id`, `transaction_id`, `account_id`, `value`, `created_at`, `updated_at`
FROM `transaction_assignments_corrected`;
DROP TABLE `transaction_assignments_corrected`;
-- create index "idx_transaction_assignments_transaction_account" to table: "transaction_assignments"
CREATE UNIQUE INDEX `idx_transaction_assignments_transaction_account` ON `transaction_assignments` (`transaction_id`, `account_id`);
