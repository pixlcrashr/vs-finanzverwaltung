import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { AccountGroupServiceService } from '../../api/services/account-group-service.service';
import { AccountGroupAssignmentServiceService } from '../../api/services/account-group-assignment-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Account, AccountGroupOperation } from '../../../app/shared/models';
import {
  AccountGroupEditDataService,
  AccountGroupDetails,
  AccountWithOperation,
} from '../../../app/routes/account-groups/account-group-edit/account-group-edit.data-service';
import { mapApiAccount, mapApiAccountGroupAssignment } from './_mappers';

@Injectable()
export class HttpAccountGroupEditDataService extends AccountGroupEditDataService {
  private readonly groupSvc = inject(AccountGroupServiceService);
  private readonly assignmentSvc = inject(AccountGroupAssignmentServiceService);
  private readonly accountSvc = inject(AccountServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private groupName(uid: string): string {
    return `${this.parent}/accountGroups/${uid}`;
  }

  private assignmentName(groupId: string, assignmentId: string): string {
    return `${this.groupName(groupId)}/assignments/${assignmentId}`;
  }

  getGroup(id: string): Observable<AccountGroupDetails> {
    const groupName = this.groupName(id);
    return combineLatest([
      this.groupSvc.AccountGroupServiceGetAccountGroup(groupName),
      this.assignmentSvc.AccountGroupAssignmentServiceListAccountGroupAssignments({ parent: groupName, pageSize: 100 }),
      this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: false }),
    ]).pipe(
      map(([group, assignmentsResp, accountsResp]) => {
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.uid ?? '', a]),
        );
        const assignments = (assignmentsResp.assignments ?? []).map((a) => {
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
          description: group.display_description ?? '',
          assignmentCount: assignments.length,
          assignments,
        };
      }),
    );
  }

  updateGroup(id: string, name: string, description: string): Observable<AccountGroupDetails> {
    return this.groupSvc.AccountGroupServiceUpdateAccountGroup({
      accountGroupName: this.groupName(id),
      accountGroup: { display_name: name, display_description: description },
    }).pipe(switchMap(() => this.getGroup(id)));
  }

  getAvailableAccounts(): Observable<Account[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: false }).pipe(
      map((resp) => (resp.accounts ?? []).map(mapApiAccount)),
    );
  }

  addAssignment(groupId: string, accountId: string): Observable<void> {
    return this.assignmentSvc.AccountGroupAssignmentServiceCreateAccountGroupAssignment({
      parent: this.groupName(groupId),
      assignment: { account_id: accountId, negate: false },
    }).pipe(map(() => undefined));
  }

  removeAssignment(groupId: string, assignmentId: string): Observable<void> {
    return this.assignmentSvc.AccountGroupAssignmentServiceDeleteAccountGroupAssignment(
      this.assignmentName(groupId, assignmentId),
    ).pipe(map(() => undefined));
  }

  getAllAccountsWithOperations(groupId: string): Observable<AccountWithOperation[]> {
    const groupName = this.groupName(groupId);
    return combineLatest([
      this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 1000, showDeleted: true }),
      this.assignmentSvc.AccountGroupAssignmentServiceListAccountGroupAssignments({ parent: groupName, pageSize: 1000 }),
    ]).pipe(
      map(([accountsResp, assignmentsResp]) => {
        const accounts = (accountsResp.accounts ?? []).map(mapApiAccount);
        const assignmentsMap = new Map(
          (assignmentsResp.assignments ?? []).map((a) => [a.account_id, a]),
        );

        return accounts.map((account) => {
          const apiAssignment = assignmentsMap.get(account.id);
          const assignment = apiAssignment
            ? {
                id: apiAssignment.uid ?? '',
                accountId: apiAssignment.account_id,
                accountCode: account.code,
                accountName: account.name,
                operation: (apiAssignment.negate ? 'S' : 'A') as AccountGroupOperation,
                targetValue: '0',
                actualValue: '0',
              }
            : null;

          return { account, assignment };
        });
      }),
    );
  }

  updateAccountOperation(_groupId: string, _accountId: string, _operation: AccountGroupOperation): Observable<void> {
    // TODO: Implement when backend API supports operation updates
    return of(undefined);
  }

  deleteGroup(id: string): Observable<void> {
    return this.groupSvc.AccountGroupServiceDeleteAccountGroup(this.groupName(id)).pipe(map(() => undefined));
  }
}
