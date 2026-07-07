package cmd

import (
	"github.com/spf13/cobra"
)

// toolCmd represents the tool command
var toolCmd = &cobra.Command{
	Use:   "tool",
	Short: "Administrative and maintenance tools",
	Long: `Administrative and maintenance tools for VS-Finanzverwaltung.

These commands are used for tasks such as creating users, managing groups,
and other operational duties.`,
}

func init() {
	rootCmd.AddCommand(toolCmd)
}
