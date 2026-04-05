package cmd

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/spf13/cobra"

	"github.com/pixlcrashr/vsfv/pkg/api"
	"github.com/pixlcrashr/vsfv/pkg/db"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Start the HTTP API server",
	Long: `Start the VS-Finanzverwaltung HTTP API server.

The server connects to the configured PostgreSQL database and listens for
incoming HTTP requests. It shuts down gracefully on SIGINT or SIGTERM.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		gormDB, err := db.Connect(config.Database.URL)
		if err != nil {
			return fmt.Errorf("connecting to database: %w", err)
		}

		sqlDB, err := gormDB.DB()
		if err != nil {
			return fmt.Errorf("getting underlying sql.DB: %w", err)
		}
		defer sqlDB.Close()

		srv := api.New(gormDB, config.App.Version, config.CORS)

		fmt.Printf("Organisation: %s\n", config.App.OrganisationName)
		fmt.Printf("Listening on %s\n", config.Server.Address)

		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

		go func() {
			if err := srv.Listen(config.Server.Address); err != nil {
				fmt.Fprintf(os.Stderr, "server error: %v\n", err)
			}
		}()

		sig := <-quit
		fmt.Printf("\nReceived signal %s, shutting down gracefully...\n", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		_ = ctx

		if err := srv.Shutdown(); err != nil {
			return fmt.Errorf("shutdown: %w", err)
		}

		fmt.Println("Server stopped.")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(serveCmd)
}
