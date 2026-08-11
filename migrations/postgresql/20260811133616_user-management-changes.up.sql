-- modify "budget_revisions" table
ALTER TABLE "public"."budget_revisions" ADD COLUMN "is_published" boolean NOT NULL DEFAULT false;
-- modify "budgets" table
ALTER TABLE "public"."budgets" ADD COLUMN "is_published" boolean NOT NULL DEFAULT false, ADD COLUMN "publish_actual_values" boolean NOT NULL DEFAULT false, ADD COLUMN "publish_actual_values_until" timestamptz NULL;
-- modify "organizations" table
ALTER TABLE "public"."organizations" ADD COLUMN "display_description" text NOT NULL DEFAULT '';
-- modify "user_settings" table
ALTER TABLE "public"."user_settings" ADD COLUMN "email_notifications" boolean NOT NULL DEFAULT false;
