package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/spf13/cobra"

	"github.com/pixlcrashr/vsfv/pkg/db"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
)

var toolDeleteOrganizationID string

var toolDeleteOrganizationCmd = &cobra.Command{
	Use:   "organization",
	Short: "Delete an organization",
	Long:  `Delete an organization by its ID. This also deletes all data owned by the organization.`,
	Run: func(cmd *cobra.Command, args []string) {
		if toolDeleteOrganizationID == "" {
			fmt.Fprintln(os.Stderr, "error: --id is required")
			os.Exit(1)
		}

		id, err := uuid.Parse(toolDeleteOrganizationID)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: invalid organization id: %v\n", err)
			os.Exit(1)
		}

		gormDB, err := db.ConnectSilent(config.Database.DSN)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: connecting to database: %v\n", err)
			os.Exit(1)
		}

		sqlDB, err := gormDB.DB()
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: getting underlying sql.DB: %v\n", err)
			os.Exit(1)
		}
		defer sqlDB.Close()

		repo := repository.NewOrganizationRepository(gormDB)
		if err := repo.Delete(context.Background(), id); err != nil {
			fmt.Fprintf(os.Stderr, "error: deleting organization: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("Deleted organization %s\n", id)
	},
}

func init() {
	toolDeleteOrganizationCmd.Flags().StringVar(&toolDeleteOrganizationID, "id", "", "Organization ID to delete")
	toolDeleteCmd.AddCommand(toolDeleteOrganizationCmd)
}
