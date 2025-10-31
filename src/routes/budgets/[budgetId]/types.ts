
export interface Revision {
  id: string;
  date: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  description: string;
  period_start: Date;
  period_end: Date;
  is_closed: boolean;
  created_at: Date;
  updated_at: Date;
  revisions: Revision[];
  lastRevisionDate: Date;
}

export interface Service {
  getBudget(id: string): Promise<Budget | null>;
}
