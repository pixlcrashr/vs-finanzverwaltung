import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import {
  DashboardDataService,
  DashboardStats,
} from '../../../app/routes/dashboard/dashboard.data-service';

@Injectable()
export class HttpDashboardDataService extends DashboardDataService {
  private readonly budgetSvc = inject(BudgetServiceService);
  private readonly accountSvc = inject(AccountServiceService);
  private readonly txnSvc = inject(TransactionServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  getStats(): Observable<DashboardStats> {
    return combineLatest([
      this.budgetSvc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }),
      this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: true }),
      this.txnSvc.TransactionServiceListTransactions({ parent: this.parent, pageSize: 1 }),
    ]).pipe(
      map(([budgetsResp, accountsResp, txnResp]) => {
        const budgets = budgetsResp.budgets ?? [];
        const accounts = accountsResp.accounts ?? [];

        const openBudgets = budgets.filter((b) => !b.is_closed).length;
        const closedBudgets = budgets.filter((b) => b.is_closed).length;
        const activeAccounts = accounts.filter((a) => !a.is_archived).length;
        const archivedAccounts = accounts.filter((a) => a.is_archived).length;

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
