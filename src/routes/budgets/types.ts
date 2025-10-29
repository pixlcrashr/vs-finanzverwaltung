
export interface Budget {
  id: string;
  display_name: string;
  display_description: string;
  period_start: Date;
  period_end: Date;
  is_closed: boolean;
}

export interface Service {
  getBudgets(offset: number, limit: number): Promise<Budget[]>;
}
