-- reverse: modify "user_settings" table
ALTER TABLE "public"."user_settings" DROP COLUMN "email_notifications";
-- reverse: modify "organizations" table
ALTER TABLE "public"."organizations" DROP COLUMN "display_description";
-- reverse: modify "budgets" table
ALTER TABLE "public"."budgets" DROP COLUMN "publish_actual_values_until", DROP COLUMN "publish_actual_values", DROP COLUMN "is_published";
-- reverse: modify "budget_revisions" table
ALTER TABLE "public"."budget_revisions" DROP COLUMN "is_published";
