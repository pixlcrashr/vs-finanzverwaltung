// Committee Model (shared across Applications and Reimbursements)

export interface Committee {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
