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
	apiserv "github.com/pixlcrashr/vsfv/pkg/api/grpc"
	"github.com/pixlcrashr/vsfv/pkg/api/grpc/services"
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

		svcSet := services.New(gormDB)

		grpcSrv, err := apiserv.NewGRPCServer(config.Server.GRPCAddress, svcSet)
		if err != nil {
			return fmt.Errorf("creating gRPC server: %w", err)
		}

		srv := api.New(gormDB, svcSet, config.App.Version, config.CORS)

		fmt.Printf("Organisation: %s\n", config.App.OrganisationName)
		fmt.Printf("Listening on %s (HTTP)\n", config.Server.Address)
		fmt.Printf("Listening on %s (gRPC)\n", grpcSrv.Addr())

		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

		go func() {
			if err := srv.Listen(config.Server.Address); err != nil {
				fmt.Fprintf(os.Stderr, "HTTP server error: %v\n", err)
			}
		}()

		go func() {
			if err := grpcSrv.Serve(); err != nil {
				fmt.Fprintf(os.Stderr, "gRPC server error: %v\n", err)
			}
		}()

		sig := <-quit
		fmt.Printf("\nReceived signal %s, shutting down gracefully...\n", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		_ = ctx

		grpcSrv.Stop()

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
