import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AddAccountToGroupDialogDataService } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.data-service';
import { AvailableAccount } from '../../../app/shared/dialogs/add-account-to-group-dialog/add-account-to-group-dialog.component';

@Injectable()
export class MockAddAccountToGroupDialogDataService extends AddAccountToGroupDialogDataService {
  getAvailableAccounts(_groupId: string): Observable<AvailableAccount[]> {
    const accounts: AvailableAccount[] = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      code: faker.string.numeric(4),
      name: faker.finance.accountName(),
    }));
    return of(accounts).pipe(delay(300));
  }

  addAccountToGroup(_groupId: string, _accountId: string): Observable<void> {
    return of(undefined).pipe(delay(500));
  }
}
