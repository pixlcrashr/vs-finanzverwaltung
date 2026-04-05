import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listBudgets,
  listAccounts,
  listTransactions,
} from '../../api/functions';
import {
  DashboardDataService,
  DashboardStats,
} from '../../../app/routes/dashboard/dashboard.data-service';

@Injectable()
export class HttpDashboardDataService extends DashboardDataService {
  private readonly api = inject(Api);

  getStats(): Observable<DashboardStats> {
    return from(
      Promise.all([
        this.api.invoke(listBudgets, { pageSize: 100 }),
        this.api.invoke(listAccounts, { pageSize: 100, showDeleted: true }),
        this.api.invoke(listTransactions, { pageSize: 1 }),
      ]),
    ).pipe(
      map(([budgetsResp, accountsResp, txnResp]) => {
        const budgets = budgetsResp.budgets ?? [];
        const accounts = accountsResp.accounts ?? [];

        const openBudgets = budgets.filter((b) => !b.isClosed).length;
        const closedBudgets = budgets.filter((b) => b.isClosed).length;
        const activeAccounts = accounts.filter((a) => !a.isArchived).length;
        const archivedAccounts = accounts.filter((a) => a.isArchived).length;

        return {
          budgets: {
            open: openBudgets,
            closed: closedBudgets,
            total: budgets.length,
          },
          accounts: {
            active: activeAccounts,
            archived: archivedAccounts,
            total: accounts.length,
          },
          transactions: {
            total: 0,
            assigned: 0,
            unassigned: 0,
          },
          rootAccountMonthly: [],
        };
      }),
    );
  }
}
