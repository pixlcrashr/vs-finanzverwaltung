package cmd

import (
	"os"

	"github.com/spf13/cobra"

	"github.com/pixlcrashr/vsfv/pkg/cfg"
)

var (
	cfgFile string
	config  *cfg.Config
)

var rootCmd = &cobra.Command{
	Use:   "vsfv",
	Short: "VS-Finanzverwaltung - Financial management for student organisations",
	Long: `VS-Finanzverwaltung is a financial management system for German student
organisations (Verfasste Studierendenschaften). It provides budget planning,
transaction management with double-entry bookkeeping, and reporting.`,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		var err error
		config, err = cfg.Load(cfgFile)
		if err != nil {
			return err
		}
		return nil
	},
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVarP(&cfgFile, "config", "c", "", "config file (default: ./config.yaml)")
}
