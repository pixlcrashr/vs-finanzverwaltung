# Agent Instructions

## Project Overview

This is a Go API server (`github.com/pixlcrashr/vsfv`) that exposes two parallel HTTP APIs on the same Fiber server:

1. **Huma REST API** — defined under `pkg/api/` (one sub-package per entity). Do not remove or break this API.
2. **gRPC-Gateway REST/JSON API** — defined via Protocol Buffers in `proto/`, generated into `pkg/api/grpc/gen/`, and served in-process via `pkg/api/grpc/server.go`. This is a pure HTTP/JSON transcoding (no TCP gRPC port); service implementations live in `pkg/api/grpc/services/`.

## Proto Code Generation

All gRPC service definitions live in `proto/`. After changing any `.proto` file you **must** regenerate the Go code.

Use the Taskfile tasks (requires [Task](https://taskfile.dev) installed):

```sh
# Validate all proto files
task proto:build

# Generate Go code (gRPC stubs, grpc-gateway, AIP helpers, OpenAPI docs)
task proto:generate
```

These are equivalent to running `buf build` and `buf generate` directly from the repo root.

Generated output directories:
- `pkg/api/grpc/gen/` — protoc-gen-go, protoc-gen-go-grpc, protoc-gen-go-aip, protoc-gen-grpc-gateway output
- `docs/proto/` — protoc-gen-doc HTML output
- `openapi.yaml` — merged OpenAPI v2 spec (protoc-gen-openapiv2 output)

**`pkg/api/grpc/gen/` is read-only at all times. Never manually edit any file in this directory.** All files are fully regenerated on every `task proto:generate` run (equivalent to `buf generate`). Treat any file in this directory as a build artifact.

## DAO Code Generation

All GORM DAO query files live in `pkg/db/model/dao/`. After changing any model in `pkg/db/model/` you **must** regenerate the DAO code.

Use the `go:generate` directive in `pkg/db/model/dao.go`:

```sh
go generate ./pkg/db/model/
# or equivalently:
go run ./tools/gen-dao/main.go -o ./pkg/db/model/dao
```

**`pkg/db/model/dao/` is read-only at all times. Never manually edit any file in this directory.** All files are fully regenerated on every `go generate` run. Treat any file in this directory as a build artifact.

## Proto Style Rules

- Package: `pixlcrashr.vsfv.v1`
- One service per entity file (e.g. `proto/account.proto` → `AccountService`)
- Follow [Google AIP](https://aip.dev) guidelines: standard methods (Get/List/Create/Update/Delete) plus custom methods with the `:verb` suffix
- Use `google.api.resource` + `google.api.resource_reference` on all resource messages and name fields
- Use `google.protobuf.FieldMask` on all Update requests
- **Do not use the `optional` keyword** (proto3 optional) — `protoc-gen-go-aip` does not support it. Use a `oneof` wrapper instead for nullable scalars
- File downloads/uploads stay in the Huma API only; do not add streaming or file RPCs to proto

## Adding a New Service

1. Create `proto/<entity>.proto` with the service definition
2. Run `task proto:generate`
3. Add the new `Unimplemented<Entity>ServiceServer` field to `pkg/api/grpc/services/services.go`
4. Call `gen.Register<Entity>ServiceHandlerServer(ctx, mux, svc.<Entity>)` in `pkg/api/grpc/server.go`
5. Implement the real server by replacing the `Unimplemented` stub with a concrete struct

## Huma REST API Style Rules

All `pkg/api/` models and routes follow these conventions:

### URL paths (`routes.go`)
- Resource collection names are **camelCase** (e.g. `/transactionAccounts`, `/reportTemplates`, `/importSources`)
- Path parameter placeholders are **snake_case** (e.g. `{transaction_id}`, `{budget_id}`, `{report_template_id}`)
- All routes are prefixed with `/old/api/v1/` (Huma mounts on the Fiber app; the grpc-gateway API is at `/api/v1/`)

### Request / response field tags (`models.go`)
- `path:"..."` tags — **snake_case** (matches the `{snake_case}` placeholder in the route path)
- `query:"..."` tags — **snake_case** (e.g. `page_size`, `page_token`, `order_by`, `display_name`, `show_deleted`, `import_source_id`)
- `json:"..."` tags — **snake_case** for all fields, including response body fields (e.g. `display_name`, `credit_transaction_account_id`, `update_time`, `create_time`, `next_page_token`)

### Soft-delete / archive fields (AIP-132)
- List requests that support soft-deleted resources expose a `show_deleted` query parameter (bool, default false)
- The corresponding Go struct field may be named `IncludeArchived` or `IncludeClosed` — only the tag name must be `show_deleted`

## Key Directories

| Path | Purpose |
|---|---|
| `proto/` | Protobuf service definitions (source of truth for gRPC API) |
| `pkg/api/grpc/gen/` | Generated Go code — **read-only**, regenerate with `buf generate` |
| `pkg/api/grpc/services/` | Service container; wire real implementations here |
| `pkg/api/grpc/server.go` | Registers grpc-gateway routes onto the Fiber app |
| `pkg/api/` | Huma REST API (one package per entity) — keep intact |
| `pkg/db/model/` | GORM database models |
| `pkg/db/model/dao/` | Generated DAO query code — **read-only**, regenerate with `go generate ./pkg/db/model/` |
| `pkg/db/repository/` | Database repository layer |
