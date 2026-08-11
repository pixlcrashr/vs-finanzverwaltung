data "external_schema" "gorm_postgres" {
  program = [
    "go",
    "run",
    "-mod=mod",
    "./tools/atlas-gorm-loader",
    "-dialect",
    "postgres",
  ]
}

data "external_schema" "gorm_sqlite" {
  program = [
    "go",
    "run",
    "-mod=mod",
    "./tools/atlas-gorm-loader",
    "-dialect",
    "sqlite",
  ]
}

env "gorm_postgres" {
  src = data.external_schema.gorm_postgres.url
  dev = "postgres://vsf:postgres@127.0.0.1:5335/vsf?sslmode=disable" // test database is 5335, dev is 5334
  migration {
    dir = "file://migrations/postgresql"
    format = "golang-migrate"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}

env "gorm_sqlite" {
  src = data.external_schema.gorm_sqlite.url
  dev = "sqlite://dev.db?mode=memory"
  migration {
    dir = "file://migrations/sqlite"
    format = "golang-migrate"
  }
  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}