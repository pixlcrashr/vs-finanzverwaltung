package xmlformat

import (
	"fmt"
	"io"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/pixlcrashr/vsfv/pkg/db/repository"
)

// RegisterRoutes wires the XML import/export endpoints onto the given Fiber app.
// The routes are intentionally simple HTTP (multipart upload) rather than gRPC
// because file import/export is involved.
func RegisterRoutes(app fiber.Router, db *gorm.DB) {
	app.Get("/api/v1/organizations/:organization_id/data:export-xml", handleExportXML(db))
	app.Post("/api/v1/organizations/:organization_id/data:import-xml", handleImportXML(db))
}

func handleExportXML(db *gorm.DB) fiber.Handler {
	deps := makeExportRepositoryDependencies(db)

	return func(c *fiber.Ctx) error {
		orgID, err := uuid.Parse(c.Params("organization_id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid organization_id",
			})
		}

		doc, err := ExportOrganization(c.Context(), deps, orgID)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		data, err := Marshal(doc)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		c.Set("Content-Type", "application/xml; charset=utf-8")
		c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"vsfv-export-%s.xml\"", orgID))
		return c.Send(data)
	}
}

func handleImportXML(db *gorm.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		orgID, err := uuid.Parse(c.Params("organization_id"))
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid organization_id",
			})
		}

		file, err := c.FormFile("file")
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "missing file field",
			})
		}

		fh, err := file.Open()
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "cannot open uploaded file",
			})
		}
		defer fh.Close()

		buf, err := io.ReadAll(fh)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "cannot read uploaded file",
			})
		}

		doc, err := Unmarshal(buf)
		if err != nil {
			return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
				"error": fmt.Sprintf("invalid xml: %v", err),
			})
		}

		if err := ImportDocument(c.Context(), db, orgID, doc); err != nil {
			return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
				"error": err.Error(),
			})
		}

		return c.SendStatus(fiber.StatusNoContent)
	}
}

func makeExportRepositoryDependencies(db *gorm.DB) *ExportRepositoryDependencies {
	return &ExportRepositoryDependencies{
		AccountRepo:                    repository.NewAccountRepository(db),
		AccountGroupRepo:               repository.NewAccountGroupRepository(db),
		AccountGroupAssignmentRepo:     repository.NewAccountGroupAssignmentRepository(db),
		BudgetRepo:                     repository.NewBudgetRepository(db),
		BudgetAccountValueRepo:         repository.NewBudgetAccountValueRepository(db),
		BudgetRevisionRepo:             repository.NewBudgetRevisionRepository(db),
		BudgetRevisionAccountValueRepo: repository.NewBudgetRevisionAccountValueRepository(db),
		LedgerAccountRepo:              repository.NewLedgerAccountRepository(db),
		LedgerYearRepo:                 repository.NewLedgerYearRepository(db),
		TransactionRepo:                repository.NewTransactionRepository(db),
		TransactionAssignmentRepo:      repository.NewTransactionAssignmentRepository(db),
	}
}
