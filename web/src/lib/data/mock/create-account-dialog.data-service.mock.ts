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
  listParentAccounts(organizationId: string): Observable<ParentAccountOption[]> {
    const accounts: ParentAccountOption[] = [
      { id: faker.string.uuid(), code: '1', name: 'Aktiva', depth: 0 },
      { id: faker.string.uuid(), code: '2', name: 'Passiva', depth: 0 },
      { id: faker.string.uuid(), code: '2.1', name: 'Personal', depth: 1 },
      { id: faker.string.uuid(), code: '2.2', name: 'Sachkosten', depth: 1 },
    ];
    return of(accounts).pipe(delay(300));
  }

  createAccount(
    organizationId: string,
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null,
    isContainer: boolean,
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
