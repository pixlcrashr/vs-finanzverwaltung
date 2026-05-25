export interface AccountGroup {
  id: string;
  name: string;
  description: string;
  assignmentCount: number;
}

export type AccountGroupOperation = 'I' | 'A' | 'S';

export interface AccountGroupAssignment {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  operation: AccountGroupOperation;
  targetValue: string;
  actualValue: string;
}

export interface AccountGroupStats {
  id: string;
  name: string;
  targetValue: string;
  actualValue: string;
  transactionCount: number;
  accounts: AccountGroupAssignment[];
}
