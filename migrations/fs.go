package migrations

import "embed"

//go:embed postgresql/*.sql
var FS embed.FS
