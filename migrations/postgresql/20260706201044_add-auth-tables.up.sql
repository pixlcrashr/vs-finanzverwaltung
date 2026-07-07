-- modify "users" table
ALTER TABLE "public"."users" ADD COLUMN "password_hash" text NULL;
-- create "auth_sessions" table
CREATE TABLE "public"."auth_sessions" (
  "id" uuid NOT NULL,
  "token" text NOT NULL,
  "user_id" uuid NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_auth_sessions_token" to table: "auth_sessions"
CREATE UNIQUE INDEX "idx_auth_sessions_token" ON "public"."auth_sessions" ("token");
-- create index "idx_auth_sessions_user_id" to table: "auth_sessions"
CREATE INDEX "idx_auth_sessions_user_id" ON "public"."auth_sessions" ("user_id");
-- create "oauth2_clients" table
CREATE TABLE "public"."oauth2_clients" (
  "id" uuid NOT NULL,
  "client_id" text NOT NULL,
  "client_name" text NOT NULL DEFAULT '',
  "client_secret" text NULL,
  "redirect_uris" text[] NULL DEFAULT '{}',
  "grant_types" text[] NULL DEFAULT '{}',
  "response_types" text[] NULL DEFAULT '{}',
  "scopes" text[] NULL DEFAULT '{}',
  "token_endpoint_auth_method" text NOT NULL DEFAULT 'none',
  "user_id" uuid NULL,
  "public" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_oauth2_clients_client_id" to table: "oauth2_clients"
CREATE UNIQUE INDEX "idx_oauth2_clients_client_id" ON "public"."oauth2_clients" ("client_id");
-- create "oauth2_tokens" table
CREATE TABLE "public"."oauth2_tokens" (
  "id" uuid NOT NULL,
  "signature" text NOT NULL,
  "request_type" text NOT NULL,
  "client_id" text NOT NULL,
  "user_id" uuid NULL,
  "scope" text[] NULL DEFAULT '{}',
  "granted_scope" text[] NULL DEFAULT '{}',
  "form_data" text NULL DEFAULT '',
  "session_data" text NULL DEFAULT '',
  "requested_at" timestamptz NOT NULL DEFAULT now(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- create index "idx_oauth2_tokens_client_id" to table: "oauth2_tokens"
CREATE INDEX "idx_oauth2_tokens_client_id" ON "public"."oauth2_tokens" ("client_id");
-- create index "idx_oauth2_tokens_request_type" to table: "oauth2_tokens"
CREATE INDEX "idx_oauth2_tokens_request_type" ON "public"."oauth2_tokens" ("request_type");
-- create index "idx_oauth2_tokens_signature_type" to table: "oauth2_tokens"
CREATE UNIQUE INDEX "idx_oauth2_tokens_signature_type" ON "public"."oauth2_tokens" ("signature", "request_type");
-- create index "idx_oauth2_tokens_user_id" to table: "oauth2_tokens"
CREATE INDEX "idx_oauth2_tokens_user_id" ON "public"."oauth2_tokens" ("user_id");
