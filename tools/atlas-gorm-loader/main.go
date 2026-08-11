package main

import (
	"flag"
	"fmt"
	"io"
	"os"

	"ariga.io/atlas-provider-gorm/gormschema"

	"github.com/pixlcrashr/vsfv/pkg/db"
)

func main() {
	dialect := flag.String("dialect", "postgres", "database dialect (postgres or sqlite)")
	flag.Parse()

	stmts, err := gormschema.New(*dialect).Load(db.Models...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load gorm schema: %v\n", err)
		os.Exit(1)
	}
	io.WriteString(os.Stdout, stmts)
}
