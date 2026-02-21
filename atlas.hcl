data "external_schema" "gorm" {
  program = [
    "go",
    "run",
    "-mod=mod",
    "./tools/atlas-gorm-loader",
  ]
}

env "gorm" {
  src = data.external_schema.gorm.url
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