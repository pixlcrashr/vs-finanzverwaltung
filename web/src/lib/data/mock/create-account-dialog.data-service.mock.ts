import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { CreateAccountDialogDataService } from '../../../app/shared/dialogs/create-account-dialog/create-account-dialog.data-service';
import {
  CreatedAccount,
  ParentAccountOption,
} from '../../../app/shared/dialogs/create-account-dialog/create-account-dialog.component';

@Injectable()
export class MockCreateAccountDialogDataService extends CreateAccountDialogDataService {
  getParentAccounts(): Observable<ParentAccountOption[]> {
    const accounts: ParentAccountOption[] = Array.from({ length: 10 }, () => ({
      id: faker.string.uuid(),
      code: faker.string.numeric(4),
      name: faker.finance.accountName(),
    }));
    return of(accounts).pipe(delay(300));
  }

  createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null
  ): Observable<CreatedAccount> {
    return of({
      id: faker.string.uuid(),
      code,
      name,
      description,
      parentAccountId,
    }).pipe(delay(500));
  }
}
