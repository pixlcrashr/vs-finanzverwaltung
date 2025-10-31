import { PrismaClient } from "@prisma/client";
import { Budget, Service } from "~/routes/budgets/[budgetId]/delete/types";

export class BudgetDeleteService implements Service {
  constructor(private prisma: PrismaClient) {}
  async getBudget(id: string): Promise<Budget | null> {
    try {
      const m = await this.prisma.budgets.findUnique({
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
      }
    } catch (error) {
      return null;
    }
  }

  async deleteBudget(budgetId: string): Promise<void> {
    await this.prisma.budgets.delete({
      where: {
        id: budgetId,
      },
    });
  }
}
