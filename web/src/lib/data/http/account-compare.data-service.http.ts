import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import {
  AccountCompareDataService,
  BudgetOption,
  CompareAccountOption,
  CompareAccountTransaction,
} from '../../../app/routes/accounts/account-compare/account-compare.data-service';
import { typeDateToDate } from './_mappers';

@Injectable()
export class HttpAccountCompareDataService extends AccountCompareDataService {
  private readonly accountSvc = inject(AccountServiceService);
  private readonly budgetSvc = inject(BudgetServiceService);
  private readonly txnSvc = inject(TransactionServiceService);

  listBudgets(organizationId: string): Observable<BudgetOption[]> {
    return this.budgetSvc.BudgetServiceListBudgets({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((resp) =>
        (resp.budgets ?? []).map((b) => ({
          id: b.uid ?? '',
          name: b.display_name,
          year: typeDateToDate(b.period_start).getFullYear(),
        })),
      ),
    );
  }

  listAccounts(organizationId: string, _budgetId: string): Observable<CompareAccountOption[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: `organizations/${organizationId}`, pageSize: 100, showDeleted: false }).pipe(
      map((resp) =>
        (resp.accounts ?? []).map((a) => ({
          id: a.uid ?? '',
          code: a.display_code,
          name: a.display_name,
          parentAccountId: a.parent_account ? a.parent_account.split('/').pop() ?? null : null,
        })),
      ),
    );
  }

  listTransactions(
    organizationId: string,
    _budgetId: string,
    _accountId: string,
  ): Observable<CompareAccountTransaction[]> {
    return this.txnSvc.TransactionServiceListTransactions({ parent: `organizations/${organizationId}`, pageSize: 100 }).pipe(
      map((resp) =>
        (resp.transactions ?? []).map((t) => ({
          id: t.uid ?? '',
          documentDate: new Date(t.document_date),
          amount: t.amount?.value ?? '',
          debitAccountCode: '',
          creditAccountCode: '',
          description: t.description ?? '',
        })),
      ),
    );
  }
}
