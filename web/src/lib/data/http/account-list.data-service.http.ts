import { Injectable, inject } from '@angular/core';
import { Observable, map, expand, reduce, EMPTY, switchMap } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { V1ListAccountsResponse } from '../../api/models/v1list-accounts-response';
import { Account } from '../../../app/shared/models';
import { AccountListDataService } from '../../../app/routes/accounts/account-list/account-list.data-service';
import { mapApiAccount, buildAccountTree } from './_mappers';

@Injectable()
export class HttpAccountListDataService extends AccountListDataService {
  private readonly svc = inject(AccountServiceService);
  private orgParent(organizationId: string): string {
    return `organizations/${organizationId}`;
  }

  private accountName(organizationId: string, uid: string): string {
    return `${this.orgParent(organizationId)}/accounts/${uid}`;
  }

  listAccounts(organizationId: string): Observable<Account[]> {
    const parent = this.orgParent(organizationId);
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
      map(buildAccountTree),
    );
  }

  createAccount(
    organizationId: string,
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null,
    isContainer: boolean,
  ): Observable<Account> {
    const parentAccount = parentAccountId ? this.accountName(organizationId, parentAccountId) : undefined;
    return this.svc.AccountServiceCreateAccount({
      parent: this.orgParent(organizationId),
      account: {
        display_name: name,
        display_code: code,
        display_description: description,
        parent_account: parentAccount,
        is_container: isContainer,
      },
    }).pipe(map(mapApiAccount));
  }

  deleteAccount(organizationId: string, id: string): Observable<void> {
    return this.svc.AccountServiceDeleteAccount(this.accountName(organizationId, id)).pipe(map(() => undefined));
  }

  archiveAccount(organizationId: string, id: string): Observable<void> {
    return this.svc.AccountServiceArchiveAccount({ name: this.accountName(organizationId, id), body: {} }).pipe(map(() => undefined));
  }

  restoreAccount(organizationId: string, id: string): Observable<void> {
    const name = this.accountName(organizationId, id);
    return this.svc.AccountServiceGetAccount(name).pipe(
      switchMap((existing) =>
        this.svc.AccountServiceUpdateAccount({
          accountName: name,
          account: { ...existing, display_name: existing.display_name, display_code: existing.display_code, is_archived: false },
        }),
      ),
      map(() => undefined),
    );
  }
}
