export interface Budget {
  id: string;
  displayName: string;
  displayDescription: string;
  periodStart: Date;
  periodEnd: Date;
  isClosed: boolean;
}

export interface BudgetRevision {
  id: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
