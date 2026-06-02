package main

import (
	"flag"
	"os"

	_db "github.com/pixlcrashr/vsfv/pkg/db"
	"gorm.io/driver/postgres"
	"gorm.io/gen"
	"gorm.io/gorm"
)

func main() {
	dsn := flag.String("dsn", "postgres://vsf:postgres@127.0.0.1:5335/vsf?sslmode=disable", "Database DSN")
	outPath := flag.String("o", "../../pkg/db/model/dao", "Output path")
	flag.Parse()

	if err := os.RemoveAll(*outPath); err != nil {
		panic(err)
	}

	g := gen.NewGenerator(gen.Config{
		OutPath:       *outPath,
		Mode:          gen.WithDefaultQuery | gen.WithQueryInterface,
		FieldNullable: true,
	})

	db, err := gorm.Open(postgres.Open(*dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}

	g.UseDB(db)

	g.ApplyBasic(
		_db.Models...,
	)

	g.Execute()
}
