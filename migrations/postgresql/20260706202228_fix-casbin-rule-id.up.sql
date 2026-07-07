-- add a temporary bigint column with sequence
CREATE SEQUENCE IF NOT EXISTS "public"."casbin_rule_id_seq";
ALTER TABLE "public"."casbin_rule" ADD COLUMN "new_id" bigint NOT NULL DEFAULT nextval('"public"."casbin_rule_id_seq"');

-- drop old uuid primary key and replace with bigint
ALTER TABLE "public"."casbin_rule" DROP CONSTRAINT "casbin_rule_pkey";
ALTER TABLE "public"."casbin_rule" DROP COLUMN "id";
ALTER TABLE "public"."casbin_rule" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "public"."casbin_rule" ADD PRIMARY KEY ("id");
ALTER SEQUENCE "public"."casbin_rule_id_seq" OWNED BY "public"."casbin_rule"."id";
