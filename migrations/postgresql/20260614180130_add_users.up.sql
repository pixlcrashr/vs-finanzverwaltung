-- create "user_settings" table
CREATE TABLE "public"."user_settings" (
  "id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "locale" text NOT NULL DEFAULT '',
  "theme" text NOT NULL DEFAULT 'system',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_user_settings_user" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
-- create index "idx_user_settings_user_id" to table: "user_settings"
CREATE UNIQUE INDEX "idx_user_settings_user_id" ON "public"."user_settings" ("user_id");
