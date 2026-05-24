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
  abstract getBudgets(): Observable<BudgetOption[]>;
  abstract getAccounts(budgetId: string): Observable<CompareAccountOption[]>;
  abstract getTransactions(
    budgetId: string,
    accountId: string,
  ): Observable<CompareAccountTransaction[]>;
}
