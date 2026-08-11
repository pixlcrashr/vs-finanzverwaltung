package cmd

import (
	"github.com/spf13/cobra"
)

var toolUpdateCmd = &cobra.Command{
	Use:   "update",
	Short: "Update resources",
	Long: `Update resources such as users and other entities.

Use subcommands to specify what to update.`,
}

func init() {
	toolCmd.AddCommand(toolUpdateCmd)
}
