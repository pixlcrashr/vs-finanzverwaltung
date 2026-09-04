package importexport

import (
	"context"
	"fmt"
	"time"

	"github.com/cockroachdb/apd/v3"
	"github.com/danielgtaylor/huma/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/db/model"
	"github.com/pixlcrashr/vsfv/pkg/db/repository"
)

const dateLayout = "2006-01-02"

// RegisterRoutes wires the import and export endpoints onto the given Huma API.
func RegisterRoutes(api huma.API, db *gorm.DB) {
	huma.Register(api, huma.Operation{
		OperationID: "import-organization-data",
		Method:      "POST",
		Path:        "/api/v1/organizations/{organization_id}/data:import",
		Summary:     "Import organisation data",
		Description: "Imports accounts, budgets, revisions and account values for an organisation in a single transaction. Existing data is not removed.",
		Tags:        []string{"Import/Export"},
	}, makeImportHandler(db))

	huma.Register(api, huma.Operation{
		OperationID: "export-organization-data",
		Method:      "GET",
		Path:        "/api/v1/organizations/{organization_id}/data:export",
		Summary:     "Export organisation data",
		Description: "Exports all accounts, budgets, revisions and account values for an organisation.",
		Tags:        []string{"Import/Export"},
	}, makeExportHandler(db))
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

type importInput struct {
	OrganizationID string     `path:"organization_id"`
	Body           V1Document `json:"body"`
}

type importOutput struct{}

func makeImportHandler(db *gorm.DB) func(context.Context, *importInput) (*importOutput, error) {
	return func(ctx context.Context, in *importInput) (*importOutput, error) {
		orgID, err := uuid.Parse(in.OrganizationID)
		if err != nil {
			return nil, huma.Error400BadRequest("invalid organization_id", err)
		}
		if in.Body.Version != V1Version {
			return nil, huma.Error422UnprocessableEntity(
				fmt.Sprintf("unsupported format version %d, expected %d", in.Body.Version, V1Version), nil,
			)
		}

		err = db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
			// fileID → DB uuid mapping built up as we insert rows
			accountIDMap := make(map[string]uuid.UUID)

			// Recursively insert accounts depth-first (parent before child)
			var insertAccounts func(accounts []V1Account, parentID uuid.NullUUID) error
			insertAccounts = func(accounts []V1Account, parentID uuid.NullUUID) error {
				for _, a := range accounts {
					if a.ID == "" {
						return fmt.Errorf("account missing id field")
					}
					if _, exists := accountIDMap[a.ID]; exists {
						return fmt.Errorf("duplicate account id %q", a.ID)
					}

					isContainer := a.IsContainer || len(a.Children) > 0
					m := &model.Account{
						OrganizationID:     orgID,
						ParentAccountID:    parentID,
						DisplayName:        a.DisplayName,
						DisplayCode:        a.DisplayCode,
						DisplayDescription: a.DisplayDescription,
						IsContainer:        isContainer,
						IsArchived:         a.IsArchived,
					}
					if err := tx.Create(m).Error; err != nil {
						return fmt.Errorf("creating account %q: %w", a.ID, err)
					}
					accountIDMap[a.ID] = m.ID

					if len(a.Children) > 0 {
						childParent := uuid.NullUUID{UUID: m.ID, Valid: true}
						if err := insertAccounts(a.Children, childParent); err != nil {
							return err
						}
					}
				}
				return nil
			}

			if err := insertAccounts(in.Body.Accounts, uuid.NullUUID{}); err != nil {
				return err
			}

			// Insert budgets
			for _, b := range in.Body.Budgets {
				if b.ID == "" {
					return fmt.Errorf("budget missing id field")
				}

				periodStart, err := time.Parse(dateLayout, b.PeriodStart)
				if err != nil {
					return fmt.Errorf("budget %q: invalid period_start %q: %w", b.ID, b.PeriodStart, err)
				}
				periodEnd, err := time.Parse(dateLayout, b.PeriodEnd)
				if err != nil {
					return fmt.Errorf("budget %q: invalid period_end %q: %w", b.ID, b.PeriodEnd, err)
				}

				bm := &model.Budget{
					OrganizationID:     orgID,
					DisplayName:        b.DisplayName,
					DisplayDescription: b.DisplayDescription,
					IsClosed:           b.IsClosed,
					PeriodStart:        periodStart,
					PeriodEnd:          periodEnd,
				}
				if err := tx.Create(bm).Error; err != nil {
					return fmt.Errorf("creating budget %q: %w", b.ID, err)
				}

				// Base account values
				for fileAccID, valStr := range b.AccountValues {
					dbAccID, ok := accountIDMap[fileAccID]
					if !ok {
						return fmt.Errorf("budget %q account_values: unknown account id %q", b.ID, fileAccID)
					}
					val, _, err := apd.NewFromString(valStr)
					if err != nil {
						return fmt.Errorf("budget %q account_values %q: invalid decimal %q: %w", b.ID, fileAccID, valStr, err)
					}
					bav := &model.BudgetAccountValue{
						OrganizationID: orgID,
						BudgetID:       bm.ID,
						AccountID:      dbAccID,
						Value:          *val,
					}
					if err := tx.Create(bav).Error; err != nil {
						return fmt.Errorf("creating budget account value: %w", err)
					}
				}

				// Revisions (in order)
				for _, rev := range b.Revisions {
					if rev.ID == "" {
						return fmt.Errorf("budget %q: revision missing id field", b.ID)
					}
					revDate, err := time.Parse(dateLayout, rev.Date)
					if err != nil {
						return fmt.Errorf("budget %q revision %q: invalid date %q: %w", b.ID, rev.ID, rev.Date, err)
					}

					revDisplayName := rev.DisplayName
					if revDisplayName == "" {
						revDisplayName = revDate.Format(dateLayout)
					}

					rm := &model.BudgetRevision{
						OrganizationID:     orgID,
						BudgetID:           bm.ID,
						DisplayName:        revDisplayName,
						DisplayDescription: rev.DisplayDescription,
						Date:               revDate,
					}
					if err := tx.Create(rm).Error; err != nil {
						return fmt.Errorf("creating revision %q: %w", rev.ID, err)
					}

					for fileAccID, valStr := range rev.AccountValues {
						dbAccID, ok := accountIDMap[fileAccID]
						if !ok {
							return fmt.Errorf("revision %q account_values: unknown account id %q", rev.ID, fileAccID)
						}
						val, _, err := apd.NewFromString(valStr)
						if err != nil {
							return fmt.Errorf("revision %q account_values %q: invalid decimal %q: %w", rev.ID, fileAccID, valStr, err)
						}
						rav := &model.BudgetRevisionAccountValue{
							OrganizationID:   orgID,
							BudgetID:         bm.ID,
							BudgetRevisionID: rm.ID,
							AccountID:        dbAccID,
							Value:            *val,
						}
						if err := tx.Create(rav).Error; err != nil {
							return fmt.Errorf("creating revision account value: %w", err)
						}
					}
				}
			}

			return nil
		})
		if err != nil {
			return nil, huma.Error422UnprocessableEntity("import failed: "+err.Error(), err)
		}

		return &importOutput{}, nil
	}
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

type exportInput struct {
	OrganizationID string `path:"organization_id"`
}

type exportOutput struct {
	Body V1Document
}

func makeExportHandler(db *gorm.DB) func(context.Context, *exportInput) (*exportOutput, error) {
	accountRepo := repository.NewAccountRepository(db)
	bavRepo := repository.NewBudgetAccountValueRepository(db)
	budgetRepo := repository.NewBudgetRepository(db)
	revRepo := repository.NewBudgetRevisionRepository(db)
	ravRepo := repository.NewBudgetRevisionAccountValueRepository(db)

	return func(ctx context.Context, in *exportInput) (*exportOutput, error) {
		orgID, err := uuid.Parse(in.OrganizationID)
		if err != nil {
			return nil, huma.Error400BadRequest("invalid organization_id", err)
		}

		// --- Accounts ---
		allAccounts, err := accountRepo.ListNested(ctx, repository.ListNestedParams{})
		if err != nil {
			return nil, huma.Error500InternalServerError("listing accounts", err)
		}

		// Filter to this org and build id → model map
		accByID := make(map[uuid.UUID]*model.Account)
		for _, a := range allAccounts {
			if a.OrganizationID == orgID {
				accByID[a.ID] = a
			}
		}

		// Build recursive tree — collect children per parent
		childrenOf := make(map[uuid.UUID][]*model.Account)
		var roots []*model.Account
		for _, a := range accByID {
			if !a.ParentAccountID.Valid {
				roots = append(roots, a)
			} else {
				childrenOf[a.ParentAccountID.UUID] = append(childrenOf[a.ParentAccountID.UUID], a)
			}
		}

		var buildAccountTree func(m *model.Account) V1Account
		buildAccountTree = func(m *model.Account) V1Account {
			node := V1Account{
				ID:                 m.ID.String(),
				DisplayName:        m.DisplayName,
				DisplayCode:        m.DisplayCode,
				DisplayDescription: m.DisplayDescription,
				IsContainer:        m.IsContainer,
				IsArchived:         m.IsArchived,
			}
			for _, child := range childrenOf[m.ID] {
				node.Children = append(node.Children, buildAccountTree(child))
			}
			return node
		}

		var docAccounts []V1Account
		for _, r := range roots {
			docAccounts = append(docAccounts, buildAccountTree(r))
		}

		// --- Budgets ---
		budgets, _, err := budgetRepo.List(ctx, repository.ListBudgetsParams{
			OrganizationID: orgID,
			PageSize:       10000,
		})
		if err != nil {
			return nil, huma.Error500InternalServerError("listing budgets", err)
		}

		var docBudgets []V1Budget
		for _, b := range budgets {
			// Base account values
			bavs, _, err := bavRepo.List(ctx, repository.ListBudgetAccountValuesParams{
				OrganizationID: orgID,
				BudgetID:       b.ID,
				PageSize:       10000,
			})
			if err != nil {
				return nil, huma.Error500InternalServerError("listing budget account values", err)
			}
			avMap := make(map[string]string, len(bavs))
			for _, bav := range bavs {
				avMap[bav.AccountID.String()] = bav.Value.String()
			}

			// Revisions
			revisions, _, err := revRepo.List(ctx, repository.ListBudgetRevisionsParams{
				BudgetID: b.ID,
				PageSize: 10000,
			})
			if err != nil {
				return nil, huma.Error500InternalServerError("listing budget revisions", err)
			}

			var docRevisions []V1BudgetRevision
			for _, rev := range revisions {
				ravs, _, err := ravRepo.List(ctx, repository.ListBudgetRevisionAccountValuesParams{
					BudgetRevisionID: rev.ID,
					PageSize:         10000,
				})
				if err != nil {
					return nil, huma.Error500InternalServerError("listing revision account values", err)
				}
				ravMap := make(map[string]string, len(ravs))
				for _, rav := range ravs {
					ravMap[rav.AccountID.String()] = rav.Value.String()
				}
				docRevisions = append(docRevisions, V1BudgetRevision{
					ID:                 rev.ID.String(),
					DisplayName:        rev.DisplayName,
					DisplayDescription: rev.DisplayDescription,
					Date:               rev.Date.Format(dateLayout),
					AccountValues:      ravMap,
				})
			}

			docBudgets = append(docBudgets, V1Budget{
				ID:                 b.ID.String(),
				DisplayName:        b.DisplayName,
				DisplayDescription: b.DisplayDescription,
				PeriodStart:        b.PeriodStart.Format(dateLayout),
				PeriodEnd:          b.PeriodEnd.Format(dateLayout),
				IsClosed:           b.IsClosed,
				AccountValues:      avMap,
				Revisions:          docRevisions,
			})
		}

		now := time.Now().UTC()
		return &exportOutput{
			Body: V1Document{
				Version:    V1Version,
				ExportedAt: &now,
				Accounts:   docAccounts,
				Budgets:    docBudgets,
			},
		}, nil
	}
}
