import { Injectable, inject } from '@angular/core';
import { Observable, from, map, throwError } from 'rxjs';
import { Api } from '../../api/api';
import {
  getAccountGroup,
  listAccountGroupAssignments,
  listAccounts,
  listBudgets,
} from '../../api/functions';
import { AccountGroupStats, Budget, BudgetTag } from '../../../app/shared/models';
import { AccountGroupStatsDataService } from '../../../app/routes/account-groups/account-group-stats/account-group-stats.data-service';
import { mapApiAccountGroupAssignment, mapApiBudget } from './_mappers';

@Injectable()
export class HttpAccountGroupStatsDataService extends AccountGroupStatsDataService {
  private readonly api = inject(Api);

  getBudgets(): Observable<Budget[]> {
    return from(
      this.api.invoke(listBudgets, { pageSize: 100 }),
    ).pipe(map((resp) => (resp.budgets ?? []).map(mapApiBudget)));
  }

  getBudgetTags(budgetId: string): Observable<BudgetTag[]> {
    // TODO: No generated API endpoint for budget tags listing.
    return throwError(() => new Error('Budget tags API is not yet implemented.'));
  }

  getGroupStats(groupId: string, budgetId: string): Observable<AccountGroupStats> {
    return from(
      Promise.all([
        this.api.invoke(getAccountGroup, { accountGroupId: groupId }),
        this.api.invoke(listAccountGroupAssignments, { accountGroupId: groupId, pageSize: 100 }),
        this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
      ]),
    ).pipe(
      map(([group, assignmentsResp, accountsResp]) => {
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.id, a]),
        );
        const accounts = (assignmentsResp.assignments ?? []).map((a) => {
          const acct = accountsMap.get(a.accountId);
          return mapApiAccountGroupAssignment(
            a,
            acct?.displayName ?? '',
            acct?.displayCode ?? '',
          );
        });
        return {
          id: group.id,
          name: group.displayName,
          targetValue: '0',
          actualValue: '0',
          transactionCount: 0,
          accounts,
        };
      }),
    );
  }

  getGroupStatsByTag(groupId: string, budgetId: string, tagId: string): Observable<AccountGroupStats> {
    // TODO: No generated API endpoint for tag-specific stats.
    return throwError(() => new Error('Tag-specific stats API is not yet implemented.'));
  }
}
