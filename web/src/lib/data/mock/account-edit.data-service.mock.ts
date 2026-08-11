import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Account } from '../../../app/shared/models';
import {
  AccountEditDataService,
  AccountDetails,
} from '../../../app/routes/accounts/account-edit/account-edit.data-service';

@Injectable()
export class MockAccountEditDataService extends AccountEditDataService {
  private accounts: AccountDetails[] = this.generateAccounts();

  getAccount(organizationId: string, id: string): Observable<AccountDetails> {
    const account = this.accounts.find((a) => a.id === id) || this.accounts[0];
    return of(account).pipe(delay(300));
  }

  updateAccount(
    organizationId: string,
    id: string,
    name: string,
    code: string,
    description: string
  ): Observable<AccountDetails> {
    const account = this.accounts.find((a) => a.id === id);
    if (account) {
      account.name = name;
      account.code = code;
      account.description = description;
      account.updatedAt = new Date();
    }
    return of(account || this.accounts[0]).pipe(delay(300));
  }

  deleteAccount(organizationId: string, id: string): Observable<void> {
    this.accounts = this.accounts.filter((a) => a.id !== id);
    return of(undefined).pipe(delay(300));
  }

  listParentAccounts(organizationId: string): Observable<Account[]> {
    return of(this.accounts.filter((a) => !a.parentAccountId)).pipe(delay(200));
  }

  private generateAccounts(): AccountDetails[] {
    const now = new Date();
    return [
      {
        id: faker.string.uuid(),
        code: '1',
        fullCode: '1',
        name: 'Einnahmen',
        description: 'Alle Einnahmen',
        depth: 0,
        childrenCount: 1,
        isArchived: false,
        parentAccountId: null,
        createdAt: new Date(now.getFullYear() - 1, 0, 1),
        updatedAt: now,
      },
      {
        id: faker.string.uuid(),
        code: '1.1',
        fullCode: '1-1.1',
        name: 'Mitgliedsbeiträge',
        description: 'Einnahmen aus Mitgliedsbeiträgen',
        depth: 1,
        childrenCount: 0,
        isArchived: false,
        parentAccountId: null,
        createdAt: new Date(now.getFullYear() - 1, 0, 1),
        updatedAt: now,
      },
      {
        id: faker.string.uuid(),
        code: '2',
        fullCode: '2',
        name: 'Ausgaben',
        description: 'Alle Ausgaben',
        depth: 0,
        childrenCount: 0,
        isArchived: false,
        parentAccountId: null,
        createdAt: new Date(now.getFullYear() - 1, 0, 1),
        updatedAt: now,
      },
    ];
  }
}
