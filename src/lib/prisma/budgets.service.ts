import { PrismaClient } from "@prisma/client";
import { Budget, Service } from "~/routes/budgets/types";



export class BudgetsService implements Service {
  public constructor(
    private readonly _prismaClient: PrismaClient
  ) {

  }

  public async getBudgets(offset: number, limit: number): Promise<Budget[]> {
    const res = await this._prismaClient.budgets.findMany({
      skip: offset,
      take: limit,
    });

    return res.map((budget) => ({
      id: budget.id,
      display_name: budget.display_name,
      display_description: budget.display_description,
      is_closed: budget.is_closed,
      period_start: budget.period_start,
      period_end: budget.period_end,
    }));
  }
}
