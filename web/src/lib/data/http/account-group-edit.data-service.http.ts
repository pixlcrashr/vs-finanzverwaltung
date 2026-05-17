import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { Api } from '../../api/api';
import {
  getAccountGroup,
  updateAccountGroup,
  listAccountGroupAssignments,
  createAccountGroupAssignment,
  deleteAccountGroupAssignment,
  deleteAccountGroup,
  listAccounts,
} from '../../api/functions';
import { Account, AccountGroupOperation } from '../../../app/shared/models';
import {
  AccountGroupEditDataService,
  AccountGroupDetails,
  AccountWithOperation,
} from '../../../app/routes/account-groups/account-group-edit/account-group-edit.data-service';
import { mapApiAccount, mapApiAccountGroupAssignment } from './_mappers';

@Injectable()
export class HttpAccountGroupEditDataService extends AccountGroupEditDataService {
  private readonly api = inject(Api);

  getGroup(id: string): Observable<AccountGroupDetails> {
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
        const assignments = (assignmentsResp.assignments ?? []).map((a) => {
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
          description: group.displayDescription,
          assignmentCount: assignments.length,
          assignments,
        };
      }),
    );
  }

  updateGroup(id: string, name: string, description: string): Observable<AccountGroupDetails> {
    return from(
      this.api.invoke(updateAccountGroup, {
        accountGroupId: id,
        body: { displayName: name, displayDescription: description },
      }),
    ).pipe(switchMap(() => this.getGroup(id)));
  }

  getAvailableAccounts(): Observable<Account[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
    ).pipe(map((resp) => (resp.accounts ?? []).map(mapApiAccount)));
  }

  addAssignment(groupId: string, accountId: string): Observable<void> {
    return from(
      this.api.invoke(createAccountGroupAssignment, {
        accountGroupId: groupId,
        body: { accountId, negate: false },
      }),
    ).pipe(map(() => undefined));
  }

  removeAssignment(groupId: string, assignmentId: string): Observable<void> {
    return from(
      this.api.invoke(deleteAccountGroupAssignment, {
        accountGroupId: groupId,
        assignmentId,
      }),
    ).pipe(map(() => undefined));
  }

  getAllAccountsWithOperations(groupId: string): Observable<AccountWithOperation[]> {
    return from(
      Promise.all([
        this.api.invoke(listAccounts, { pageSize: 1000, showDeleted: true }),
        this.api.invoke(listAccountGroupAssignments, { accountGroupId: groupId, pageSize: 1000 }),
      ]),
    ).pipe(
      map(([accountsResp, assignmentsResp]) => {
        const accounts = (accountsResp.accounts ?? []).map(mapApiAccount);
        const assignmentsMap = new Map(
          (assignmentsResp.assignments ?? []).map((a) => [a.accountId, a]),
        );

        return accounts.map((account) => {
          const apiAssignment = assignmentsMap.get(account.id);
          const assignment = apiAssignment
            ? {
                id: apiAssignment.id,
                accountId: apiAssignment.accountId,
                accountCode: account.code,
                accountName: account.name,
                operation: (apiAssignment.negate ? 'S' : 'A') as AccountGroupOperation,
              }
            : null;

          return { account, assignment };
        });
      }),
    );
  }

  updateAccountOperation(groupId: string, accountId: string, operation: AccountGroupOperation): Observable<void> {
    // TODO: Implement when backend API supports operation updates
    // For now, this is a placeholder that does nothing
    return from(Promise.resolve(undefined));
  }

  deleteGroup(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteAccountGroup, {
        accountGroupId: id,
      })
    ).pipe(map(() => undefined));
  }
}
