package dialect

// Dialect identifies the database provider in use.
type Dialect string

const (
	PostgreSQL Dialect = "postgres"
	SQLite     Dialect = "sqlite"
)

// Current is set by db.Connect/db.ConnectSilent and reflects the database
// provider of the active connection. Other packages (e.g. types.StringArray)
// use it to choose provider-specific serialization.
var Current Dialect
