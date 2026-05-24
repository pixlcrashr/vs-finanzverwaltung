import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listBudgets,
  listAccounts,
  listTransactions,
} from '../../api/functions';
import {
  AccountCompareDataService,
  BudgetOption,
  CompareAccountOption,
  CompareAccountTransaction,
} from '../../../app/routes/accounts/account-compare/account-compare.data-service';
import { mapApiBudget } from './_mappers';

@Injectable()
export class HttpAccountCompareDataService extends AccountCompareDataService {
  private readonly api = inject(Api);

  getBudgets(): Observable<BudgetOption[]> {
    return from(
      this.api.invoke(listBudgets, { pageSize: 100 }),
    ).pipe(
      map((resp) =>
        (resp.budgets ?? []).map((b) => ({
          id: b.id,
          name: b.displayName,
          year: new Date(b.periodStart).getFullYear(),
        })),
      ),
    );
  }

  getAccounts(budgetId: string): Observable<CompareAccountOption[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
    ).pipe(
      map((resp) =>
        (resp.accounts ?? []).map((a) => ({
          id: a.id,
          code: a.displayCode,
          name: a.displayName,
          parentAccountId: a.parentAccountId ?? null,
        })),
      ),
    );
  }

  getTransactions(
    budgetId: string,
    accountId: string,
  ): Observable<CompareAccountTransaction[]> {
    return from(
      this.api.invoke(listTransactions, { pageSize: 100 }),
    ).pipe(
      map((resp) =>
        (resp.transactions ?? []).map((t) => ({
          id: t.id,
          documentDate: new Date(t.documentDate),
          amount: t.amount,
          debitAccountCode: '',
          creditAccountCode: '',
          description: t.description,
        })),
      ),
    );
  }
}
