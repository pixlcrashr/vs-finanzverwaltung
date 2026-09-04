package cmd

import (
	"github.com/spf13/cobra"
)

var deleteCmd = &cobra.Command{
	Use:   "delete",
	Short: "Delete resources",
	Long: `Delete resources such as organizations, users, and other entities.

Use subcommands to specify what to delete.`,
}

func init() {
	rootCmd.AddCommand(deleteCmd)
}
