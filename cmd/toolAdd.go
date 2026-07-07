package cmd

import (
	"github.com/spf13/cobra"
)

var toolAddCmd = &cobra.Command{
	Use:   "add",
	Short: "Add resources",
	Long: `Add resources such as users and other entities.

Use subcommands to specify what to add.`,
}

func init() {
	toolCmd.AddCommand(toolAddCmd)
}
