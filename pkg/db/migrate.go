package db

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	sqlitedriver "github.com/golang-migrate/migrate/v4/database/sqlite3"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/pixlcrashr/vsfv/migrations"
	"github.com/pixlcrashr/vsfv/pkg/db/dialect"
)

// Run applies all pending up migrations.
func Run(db *sql.DB) error {
	m, err := newMigrator(db)
	if err != nil {
		return err
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("run: %w", err)
	}

	return nil
}

// Rollback rolls back the last applied migration.
func Rollback(db *sql.DB) error {
	m, err := newMigrator(db)
	if err != nil {
		return err
	}

	if err := m.Steps(-1); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("rollback: %w", err)
	}

	return nil
}

// RollbackAll rolls back all applied migrations.
func RollbackAll(db *sql.DB) error {
	m, err := newMigrator(db)
	if err != nil {
		return err
	}

	if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("rollback all: %w", err)
	}

	return nil
}

// Version returns the current migration version and dirty state.
func Version(db *sql.DB) (uint, bool, error) {
	m, err := newMigrator(db)
	if err != nil {
		return 0, false, err
	}

	version, dirty, err := m.Version()
	if err != nil && !errors.Is(err, migrate.ErrNilVersion) {
		return 0, false, fmt.Errorf("getting version: %w", err)
	}

	return version, dirty, nil
}

// Steps applies n migrations. Positive n = up, negative n = down.
func Steps(db *sql.DB, n int) error {
	m, err := newMigrator(db)
	if err != nil {
		return err
	}

	if err := m.Steps(n); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("step migration: %w", err)
	}

	return nil
}

// Force sets a specific migration version without running migrations.
// Useful for fixing a dirty state.
func Force(db *sql.DB, version int) error {
	m, err := newMigrator(db)
	if err != nil {
		return err
	}

	if err := m.Force(version); err != nil {
		return fmt.Errorf("force version: %w", err)
	}

	return nil
}

func newMigrator(db *sql.DB) (*migrate.Migrate, error) {
	switch dialect.Current {
	case dialect.SQLite:
		dbDriver, err := sqlitedriver.WithInstance(db, &sqlitedriver.Config{})
		if err != nil {
			return nil, fmt.Errorf("creating sqlite database driver: %w", err)
		}

		sD, err := iofs.New(migrations.SQLiteFS, "sqlite")
		if err != nil {
			return nil, fmt.Errorf("creating source driver: %w", err)
		}

		m, err := migrate.NewWithInstance("iofs", sD, "sqlite", dbDriver)
		if err != nil {
			return nil, fmt.Errorf("creating migrator: %w", err)
		}

		sD.First()
		return m, nil

	default:
		dbDriver, err := postgres.WithInstance(db, &postgres.Config{})
		if err != nil {
			return nil, fmt.Errorf("creating postgres database driver: %w", err)
		}

		sD, err := iofs.New(migrations.PostgreSQLFS, "postgresql")
		if err != nil {
			return nil, fmt.Errorf("creating source driver: %w", err)
		}

		m, err := migrate.NewWithInstance("iofs", sD, "postgres", dbDriver)
		if err != nil {
			return nil, fmt.Errorf("creating migrator: %w", err)
		}

		sD.First()
		return m, nil
	}
}
