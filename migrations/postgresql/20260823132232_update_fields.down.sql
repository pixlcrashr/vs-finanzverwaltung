-- reverse: rename a column from "picture" to "picture_url"
ALTER TABLE "public"."users" RENAME COLUMN "picture_url" TO "picture";
