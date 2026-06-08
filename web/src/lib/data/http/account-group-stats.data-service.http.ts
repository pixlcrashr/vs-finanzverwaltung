import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, throwError } from 'rxjs';
import { AccountGroupServiceService } from '../../api/services/account-group-service.service';
import { AccountGroupAssignmentServiceService } from '../../api/services/account-group-assignment-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { AccountGroupStats, Budget, BudgetTag } from '../../../app/shared/models';
import { AccountGroupStatsDataService } from '../../../app/routes/account-groups/account-group-stats/account-group-stats.data-service';
import { mapApiAccountGroupAssignment, mapApiBudget } from './_mappers';

@Injectable()
export class HttpAccountGroupStatsDataService extends AccountGroupStatsDataService {
  private readonly groupSvc = inject(AccountGroupServiceService);
  private readonly assignmentSvc = inject(AccountGroupAssignmentServiceService);
  private readonly accountSvc = inject(AccountServiceService);
  private readonly budgetSvc = inject(BudgetServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private groupName(uid: string): string {
    return `${this.parent}/accountGroups/${uid}`;
  }

  getBudgets(): Observable<Budget[]> {
    return this.budgetSvc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.budgets ?? []).map(mapApiBudget)),
    );
  }

  getBudgetTags(_budgetId: string): Observable<BudgetTag[]> {
    // TODO: No generated API endpoint for budget tags listing.
    return throwError(() => new Error('Budget tags API is not yet implemented.'));
  }

  getGroupStats(groupId: string, _budgetId: string): Observable<AccountGroupStats> {
    const groupName = this.groupName(groupId);
    return combineLatest([
      this.groupSvc.AccountGroupServiceGetAccountGroup(groupName),
      this.assignmentSvc.AccountGroupAssignmentServiceListAccountGroupAssignments({ parent: groupName, pageSize: 100 }),
      this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: false }),
    ]).pipe(
      map(([group, assignmentsResp, accountsResp]) => {
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.uid ?? '', a]),
        );
        const accounts = (assignmentsResp.assignments ?? []).map((a) => {
          const acct = accountsMap.get(a.account_id);
          return mapApiAccountGroupAssignment(
            a,
            acct?.display_name ?? '',
            acct?.display_code ?? '',
          );
        });
        return {
          id: group.uid ?? '',
          name: group.display_name,
          targetValue: '0',
          actualValue: '0',
          transactionCount: 0,
          accounts,
        };
      }),
    );
  }

  getGroupStatsByTag(_groupId: string, _budgetId: string, _tagId: string): Observable<AccountGroupStats> {
    // TODO: No generated API endpoint for tag-specific stats.
    return throwError(() => new Error('Tag-specific stats API is not yet implemented.'));
  }
}
