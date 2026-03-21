export interface Transaction {
  id: string;
  documentDate: Date;
  bookedAt: Date;
  updatedAt: Date;
  amount: string;
  debitAccountId: string;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountId: string;
  creditAccountCode: string;
  creditAccountName: string;
  description: string;
  assignedAccountId: string | null;
  accountAssignments: TransactionAccountAssignment[];
}

export interface TransactionAccountAssignment {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  value: string;
}
