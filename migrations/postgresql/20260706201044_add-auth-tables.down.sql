-- reverse: create index "idx_oauth2_tokens_user_id" to table: "oauth2_tokens"
DROP INDEX "public"."idx_oauth2_tokens_user_id";
-- reverse: create index "idx_oauth2_tokens_signature_type" to table: "oauth2_tokens"
DROP INDEX "public"."idx_oauth2_tokens_signature_type";
-- reverse: create index "idx_oauth2_tokens_request_type" to table: "oauth2_tokens"
DROP INDEX "public"."idx_oauth2_tokens_request_type";
-- reverse: create index "idx_oauth2_tokens_client_id" to table: "oauth2_tokens"
DROP INDEX "public"."idx_oauth2_tokens_client_id";
-- reverse: create "oauth2_tokens" table
DROP TABLE "public"."oauth2_tokens";
-- reverse: create index "idx_oauth2_clients_client_id" to table: "oauth2_clients"
DROP INDEX "public"."idx_oauth2_clients_client_id";
-- reverse: create "oauth2_clients" table
DROP TABLE "public"."oauth2_clients";
-- reverse: create index "idx_auth_sessions_user_id" to table: "auth_sessions"
DROP INDEX "public"."idx_auth_sessions_user_id";
-- reverse: create index "idx_auth_sessions_token" to table: "auth_sessions"
DROP INDEX "public"."idx_auth_sessions_token";
-- reverse: create "auth_sessions" table
DROP TABLE "public"."auth_sessions";
-- reverse: modify "users" table
ALTER TABLE "public"."users" DROP COLUMN "password_hash";
