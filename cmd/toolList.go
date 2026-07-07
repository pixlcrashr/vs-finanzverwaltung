package cmd

import (
	"github.com/spf13/cobra"
)

var toolListCmd = &cobra.Command{
	Use:   "list",
	Short: "List resources",
	Long: `List resources such as user groups and other entities.

Use subcommands to specify what to list.`,
}

func init() {
	toolCmd.AddCommand(toolListCmd)
}
