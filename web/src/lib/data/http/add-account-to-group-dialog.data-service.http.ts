import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { listAccounts, createAccountGroupAssignment } from '../../api/functions';
import { AddAccountToGroupDialogDataService } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.data-service';
import { AvailableAccount } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.component';

@Injectable()
export class HttpAddAccountToGroupDialogDataService extends AddAccountToGroupDialogDataService {
  private readonly api = inject(Api);

  getAvailableAccounts(_groupId: string): Observable<AvailableAccount[]> {
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

  addAccountToGroup(groupId: string, accountId: string): Observable<void> {
    return from(
      this.api.invoke(createAccountGroupAssignment, {
        accountGroupId: groupId,
        body: { accountId, negate: false },
      })
    ).pipe(map(() => undefined));
  }
}
