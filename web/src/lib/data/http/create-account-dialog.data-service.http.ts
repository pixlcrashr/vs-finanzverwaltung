import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { listAccounts, createAccount } from '../../api/functions';
import { CreateAccountDialogDataService } from '../../../app/shared/dialogs/create-account-dialog/create-account-dialog.data-service';
import {
  CreatedAccount,
  ParentAccountOption,
} from '../../../app/shared/dialogs/create-account-dialog/create-account-dialog.component';

@Injectable()
export class HttpCreateAccountDialogDataService extends CreateAccountDialogDataService {
  private readonly api = inject(Api);

  getParentAccounts(): Observable<ParentAccountOption[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 100 })
    ).pipe(
      map((response) =>
        (response.accounts ?? []).map((account) => ({
          id: account.id,
          code: account.displayCode,
          name: account.displayName,
        }))
      )
    );
  }

  createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null
  ): Observable<CreatedAccount> {
    return from(
      this.api.invoke(createAccount, {
        body: {
          displayName: name,
          displayCode: code,
          displayDescription: description,
          parentAccountId: parentAccountId ?? undefined,
        },
      })
    ).pipe(
      map((response) => ({
        id: response.id,
        code: response.displayCode,
        name: response.displayName,
        description: response.displayDescription,
        parentAccountId: response.parentAccountId ?? null,
      }))
    );
  }
}
