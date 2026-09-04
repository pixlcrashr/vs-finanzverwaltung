package cmd

import (
	"github.com/spf13/cobra"
)

var toolCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create resources",
	Long: `Create resources such as organizations, users, and other entities.

Use subcommands to specify what to create.`,
}

func init() {
	toolCmd.AddCommand(toolCreateCmd)
}
