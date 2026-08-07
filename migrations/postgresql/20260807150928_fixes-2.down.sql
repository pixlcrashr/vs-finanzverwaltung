-- reverse: drop "group_organizations" table
CREATE TABLE "public"."group_organizations" (
  "id" uuid NOT NULL,
  "user_group_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "fk_organizations_group_organizations" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_user_groups_group_organizations" FOREIGN KEY ("user_group_id") REFERENCES "public"."user_groups" ("id") ON UPDATE NO ACTION ON DELETE NO ACTION
);
CREATE UNIQUE INDEX "idx_group_organizations_group_org" ON "public"."group_organizations" ("user_group_id", "organization_id");
