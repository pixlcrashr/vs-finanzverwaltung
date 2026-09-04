package cmd

import (
	"github.com/spf13/cobra"
)

var listCmd = &cobra.Command{
	Use:   "list",
	Short: "List resources",
	Long: `List resources such as user groups and other entities.

Use subcommands to specify what to list.`,
}

func init() {
	rootCmd.AddCommand(listCmd)
}
