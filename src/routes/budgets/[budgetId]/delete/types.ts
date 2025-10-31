
export interface Budget {
  id: string;
  name: string;
}

export interface Service {
  getBudget(budgetId: string): Promise<Budget | null>;
  deleteBudget(budgetId: string): Promise<void>;
}
