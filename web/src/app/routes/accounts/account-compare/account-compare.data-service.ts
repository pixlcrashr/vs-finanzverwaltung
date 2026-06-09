import { Observable } from 'rxjs';

export interface BudgetOption {
  id: string;
  name: string;
  year: number;
}

export interface CompareAccountOption {
  id: string;
  code: string;
  name: string;
  parentAccountId?: string | null;
  depth?: number;
}

export interface CompareAccountTransaction {
  id: string;
  documentDate: Date;
  amount: string;
  debitAccountCode: string;
  creditAccountCode: string;
  description: string;
}

export abstract class AccountCompareDataService {
  abstract listBudgets(organizationId: string): Observable<BudgetOption[]>;
  abstract listAccounts(organizationId: string, budgetId: string): Observable<CompareAccountOption[]>;
  abstract listTransactions(
    organizationId: string,
    budgetId: string,
    accountId: string,
  ): Observable<CompareAccountTransaction[]>;
}
