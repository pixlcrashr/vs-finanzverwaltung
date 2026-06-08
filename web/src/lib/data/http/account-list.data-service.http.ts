import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Account } from '../../../app/shared/models';
import { AccountListDataService } from '../../../app/routes/accounts/account-list/account-list.data-service';
import { mapApiAccount, buildAccountTree } from './_mappers';

@Injectable()
export class HttpAccountListDataService extends AccountListDataService {
  private readonly svc = inject(AccountServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private accountName(uid: string): string {
    return `${this.parent}/accounts/${uid}`;
  }

  getAccounts(): Observable<Account[]> {
    return this.svc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: true }).pipe(
      map((resp) => {
        const flat = (resp.accounts ?? []).map(mapApiAccount);
        return buildAccountTree(flat);
      }),
    );
  }

  createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null,
  ): Observable<Account> {
    const parentAccount = parentAccountId ? this.accountName(parentAccountId) : undefined;
    return this.svc.AccountServiceCreateAccount({
      parent: this.parent,
      account: {
        display_name: name,
        display_code: code,
        display_description: description,
        parent_account: parentAccount,
      },
    }).pipe(map(mapApiAccount));
  }

  deleteAccount(id: string): Observable<void> {
    return this.svc.AccountServiceDeleteAccount(this.accountName(id)).pipe(map(() => undefined));
  }

  archiveAccount(id: string): Observable<void> {
    return this.svc.AccountServiceArchiveAccount({ name: this.accountName(id), body: {} }).pipe(map(() => undefined));
  }

  restoreAccount(id: string): Observable<void> {
    const name = this.accountName(id);
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
