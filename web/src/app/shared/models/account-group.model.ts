export interface AccountGroup {
  id: string;
  name: string;
  description: string;
  assignmentCount: number;
}

export interface AccountGroupAssignment {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
}

export interface AccountGroupStats {
  id: string;
  name: string;
  totalValue: string;
  transactionCount: number;
  accounts: AccountGroupAssignment[];
}
