
export interface Service {
  createBudget(name: string, description: string, startDate: Date, endDate: Date): Promise<void>;
}
