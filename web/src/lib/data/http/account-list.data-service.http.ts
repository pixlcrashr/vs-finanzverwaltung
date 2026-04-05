import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listAccounts,
  createAccount,
  deleteAccount,
  archiveAccount,
  updateAccount,
} from '../../api/functions';
import { Account } from '../../../app/shared/models';
import { AccountListDataService } from '../../../app/routes/accounts/account-list/account-list.data-service';
import { mapApiAccount, buildAccountTree } from './_mappers';

@Injectable()
export class HttpAccountListDataService extends AccountListDataService {
  private readonly api = inject(Api);

  getAccounts(): Observable<Account[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 100, showDeleted: true }),
    ).pipe(
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
    return from(
      this.api.invoke(createAccount, {
        body: {
          displayName: name,
          displayCode: code,
          displayDescription: description,
          parentAccountId: parentAccountId ?? undefined,
        },
      }),
    ).pipe(map(mapApiAccount));
  }

  deleteAccount(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteAccount, { accountId: id }),
    ).pipe(map(() => undefined));
  }

  archiveAccount(id: string): Observable<void> {
    return from(
      this.api.invoke(archiveAccount, { accountId: id }),
    ).pipe(map(() => undefined));
  }

  restoreAccount(id: string): Observable<void> {
    return from(
      this.api.invoke(updateAccount, {
        accountId: id,
        body: { displayName: '' },
      }),
    ).pipe(map(() => undefined));
  }
}
