package migrations

import "embed"

//go:embed postgresql/*.sql
var PostgreSQLFS embed.FS

//go:embed sqlite/*.sql
var SQLiteFS embed.FS
