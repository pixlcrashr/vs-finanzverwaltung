import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  getAccountGroup,
  listAccountGroupAssignments,
  listAccounts,
} from '../../api/functions';
import { AccountGroupStats } from '../../../app/shared/models';
import { AccountGroupStatsDataService } from '../../../app/routes/account-groups/account-group-stats/account-group-stats.data-service';
import { mapApiAccountGroupAssignment } from './_mappers';

@Injectable()
export class HttpAccountGroupStatsDataService extends AccountGroupStatsDataService {
  private readonly api = inject(Api);

  getGroup(id: string): Observable<AccountGroupStats> {
    return from(
      Promise.all([
        this.api.invoke(getAccountGroup, { accountGroupId: id }),
        this.api.invoke(listAccountGroupAssignments, { accountGroupId: id, pageSize: 100 }),
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
          totalValue: '0',
          transactionCount: 0,
          accounts,
        };
      }),
    );
  }
}
