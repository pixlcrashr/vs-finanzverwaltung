import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  getAccount,
  updateAccount,
  listAccounts,
} from '../../api/functions';
import { Account } from '../../../app/shared/models';
import {
  AccountEditDataService,
  AccountDetails,
} from '../../../app/routes/accounts/account-edit/account-edit.data-service';
import { mapApiAccount } from './_mappers';

@Injectable()
export class HttpAccountEditDataService extends AccountEditDataService {
  private readonly api = inject(Api);

  getAccount(id: string): Observable<AccountDetails> {
    return from(this.api.invoke(getAccount, { accountId: id })).pipe(
      map((a) => ({
        ...mapApiAccount(a),
        createdAt: new Date(a.createTime),
        updatedAt: new Date(a.updateTime),
      })),
    );
  }

  updateAccount(
    id: string,
    name: string,
    code: string,
    description: string,
  ): Observable<AccountDetails> {
    return from(
      this.api.invoke(updateAccount, {
        accountId: id,
        body: {
          displayName: name,
          displayDescription: description,
        },
      }),
    ).pipe(
      map((a) => ({
        ...mapApiAccount(a),
        createdAt: new Date(a.createTime),
        updatedAt: new Date(a.updateTime),
      })),
    );
  }

  getParentAccounts(): Observable<Account[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
    ).pipe(map((resp) => (resp.accounts ?? []).map(mapApiAccount)));
  }
}
