import { PrismaClient } from "@prisma/client";
import { Budget, Service } from "~/routes/budgets/[budgetId]/types";

export class BudgetService implements Service {
  constructor(private prisma: PrismaClient) {}

  async getBudget(id: string): Promise<Budget | null> {
    try {
      const m = await this.prisma.budgets.findUnique({
        include: {
          budget_revisions: true,
        },
        where: {
          id: id,
        },
      });
      if (!m) {
        return null;
      }

      return {
        id: m.id,
        name: m.display_name,
        description: m.display_description,
        period_start: m.period_start,
        period_end: m.period_end,
        is_closed: m.is_closed,
        created_at: m.created_at,
        updated_at: m.updated_at,
        revisions: m.budget_revisions.map((r) => ({
          id: r.id,
          date: r.date,
          description: r.display_description,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        })),
      }
    } catch (error) {
      return null;
    }
  }
}
