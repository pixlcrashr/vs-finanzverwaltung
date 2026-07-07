-- reverse: drop primary key and bigint default
ALTER TABLE "public"."casbin_rule" DROP CONSTRAINT "casbin_rule_pkey";
ALTER TABLE "public"."casbin_rule" ALTER COLUMN "id" DROP DEFAULT;

-- add a temporary uuid column
ALTER TABLE "public"."casbin_rule" ADD COLUMN "new_id" uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "public"."casbin_rule" DROP COLUMN "id";
ALTER TABLE "public"."casbin_rule" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "public"."casbin_rule" ADD PRIMARY KEY ("id");

-- reverse: drop sequence
DROP SEQUENCE IF EXISTS "public"."casbin_rule_id_seq";
