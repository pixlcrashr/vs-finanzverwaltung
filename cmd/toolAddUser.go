package cmd

import (
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	"github.com/spf13/cobra"

	"github.com/pixlcrashr/vsfv/pkg/authz"
	"github.com/pixlcrashr/vsfv/pkg/db"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
	"github.com/pixlcrashr/vsfv/pkg/tool/adduser"
	"github.com/pixlcrashr/vsfv/pkg/tool/tui"
)

var (
	addUserEmail string
	addUserName  string
	addUserGroup string
)

var toolAddUserCmd = &cobra.Command{
	Use:   "user",
	Short: "Create a new user with a password and optional group assignment",
	Long: `Create a new user with an email, name, and password.

Email and name can be provided via flags or will be prompted interactively.
The password is always entered interactively (hidden input, similar to SSH).
If a group is provided (by UUID or custom ID), the user is assigned to that
group in the same transaction — if any step fails, all changes are rolled back.`,
	Run: func(cmd *cobra.Command, args []string) {
		email := addUserEmail
		name := addUserName

		if email == "" {
			var err error
			email, err = tui.TextPrompt("Email")
			if err != nil {
				fmt.Fprintf(os.Stderr, "error: %v\n", err)
				os.Exit(1)
			}
		}

		if name == "" {
			var err error
			name, err = tui.TextPrompt("Name")
			if err != nil {
				fmt.Fprintf(os.Stderr, "error: %v\n", err)
				os.Exit(1)
			}
		}

		password, err := tui.PasswordPrompt("Enter password")
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %v\n", err)
			os.Exit(1)
		}

		gormDB, err := db.ConnectSilent(config.Database.URL)
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

		enforcer, err := authz.NewEnforcer(gormDB)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: creating enforcer: %v\n", err)
			os.Exit(1)
		}

		var groupID *uuid.UUID
		if addUserGroup != "" {
			groupRepo := repository.NewUserGroupRepository(gormDB, enforcer)

			if id, err := uuid.Parse(addUserGroup); err == nil {
				group, err := groupRepo.GetByID(context.Background(), id)
				if err != nil {
					fmt.Fprintf(os.Stderr, "error: group not found by UUID %s: %v\n", addUserGroup, err)
					os.Exit(1)
				}
				groupID = &group.ID
			} else {
				group, err := groupRepo.GetByCustomID(context.Background(), addUserGroup)
				if err != nil {
					fmt.Fprintf(os.Stderr, "error: group not found by custom ID %q: %v\n", addUserGroup, err)
					os.Exit(1)
				}
				groupID = &group.ID
			}
		}

		result, err := adduser.Create(context.Background(), gormDB, enforcer, adduser.CreateUserParams{
			Email:    email,
			Name:     name,
			Password: password,
			GroupID:  groupID,
		})
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: failed to create user: %v\n", err)
			os.Exit(1)
		}

		fmt.Printf("✓ User created: %s (ID: %s)\n", email, result.UserID)
		if result.GroupID != nil {
			fmt.Printf("✓ Assigned to group: %s\n", *result.GroupID)
		}
	},
}

func init() {
	toolAddCmd.AddCommand(toolAddUserCmd)

	toolAddUserCmd.Flags().StringVar(&addUserEmail, "email", "", "User email (prompted if not provided)")
	toolAddUserCmd.Flags().StringVar(&addUserName, "name", "", "User name (prompted if not provided)")
	toolAddUserCmd.Flags().StringVarP(&addUserGroup, "group", "g", "", "Group UUID or custom ID to assign the user to")
}
