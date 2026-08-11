import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap, expand, reduce, EMPTY } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { V1ListAccountsResponse } from '../../api/models/v1list-accounts-response';
import { Account } from '../../../app/shared/models';
import {
  AccountEditDataService,
  AccountDetails,
} from '../../../app/routes/accounts/account-edit/account-edit.data-service';
import { mapApiAccount } from './_mappers';

@Injectable()
export class HttpAccountEditDataService extends AccountEditDataService {
  private readonly svc = inject(AccountServiceService);

  private accountName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/accounts/${uid}`;
  }

  private listAllAccounts(organizationId: string): Observable<Account[]> {
    const parent = `organizations/${organizationId}`;
    return this.svc.AccountServiceListAccounts({ parent, pageSize: 1000, showDeleted: true }).pipe(
      expand((resp: V1ListAccountsResponse) =>
        resp.next_page_token
          ? this.svc.AccountServiceListAccounts({ parent, pageSize: 1000, showDeleted: true, pageToken: resp.next_page_token })
          : EMPTY
      ),
      reduce((all: Account[], resp: V1ListAccountsResponse) =>
        all.concat((resp.accounts ?? []).map(mapApiAccount)),
        []
      ),
    );
  }

  private computeDepth(accounts: Account[], targetId: string): number {
    const byId = new Map(accounts.map((a) => [a.id, a]));
    let depth = 0;
    let current = byId.get(targetId);
    while (current?.parentAccountId && byId.has(current.parentAccountId)) {
      depth++;
      current = byId.get(current.parentAccountId);
    }
    return depth;
  }

  private computeChildrenCount(accounts: Account[], targetId: string): number {
    return accounts.filter((a) => a.parentAccountId === targetId).length;
  }

  getAccount(organizationId: string, id: string): Observable<AccountDetails> {
    return this.svc.AccountServiceGetAccount(this.accountName(organizationId, id)).pipe(
      switchMap((a) =>
        this.listAllAccounts(organizationId).pipe(
          map((all) => ({
            ...mapApiAccount(a),
            createdAt: new Date(a.create_time ?? ''),
            updatedAt: new Date(a.update_time ?? ''),
            depth: this.computeDepth(all, id),
            childrenCount: this.computeChildrenCount(all, id),
          })),
        ),
      ),
    );
  }

  updateAccount(
    organizationId: string,
    id: string,
    name: string,
    code: string,
    description: string,
  ): Observable<AccountDetails> {
    return this.svc.AccountServiceUpdateAccount({
      accountName: this.accountName(organizationId, id),
      account: { display_name: name, display_code: code, display_description: description },
    }).pipe(
      switchMap((a) =>
        this.listAllAccounts(organizationId).pipe(
          map((all) => ({
            ...mapApiAccount(a),
            createdAt: new Date(a.create_time ?? ''),
            updatedAt: new Date(a.update_time ?? ''),
            depth: this.computeDepth(all, id),
            childrenCount: this.computeChildrenCount(all, id),
          })),
        ),
      ),
    );
  }

  deleteAccount(organizationId: string, id: string): Observable<void> {
    return this.svc.AccountServiceDeleteAccount(this.accountName(organizationId, id)).pipe(map(() => undefined));
  }

  listParentAccounts(organizationId: string): Observable<Account[]> {
    return this.svc.AccountServiceListAccounts({ parent: `organizations/${organizationId}`, pageSize: 100, showDeleted: false }).pipe(
      map((resp) => (resp.accounts ?? []).map(mapApiAccount)),
    );
  }
}
