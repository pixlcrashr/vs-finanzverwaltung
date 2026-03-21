import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AccountGroupStats } from '../../../app/shared/models';
import { AccountGroupViewDataService } from '../../../app/routes/account-groups/account-group-view/account-group-view.data-service';

@Injectable()
export class MockAccountGroupViewDataService extends AccountGroupViewDataService {
  getGroup(id: string): Observable<AccountGroupStats> {
    const group: AccountGroupStats = {
      id,
      name: 'Personalkosten',
      totalValue: '45000.00',
      transactionCount: 127,
      accounts: [
        {
          id: faker.string.uuid(),
          accountId: faker.string.uuid(),
          accountCode: '2.1.1',
          accountName: 'Gehälter',
        },
        {
          id: faker.string.uuid(),
          accountId: faker.string.uuid(),
          accountCode: '2.1.2',
          accountName: 'Sozialabgaben',
        },
        {
          id: faker.string.uuid(),
          accountId: faker.string.uuid(),
          accountCode: '2.1.3',
          accountName: 'Weiterbildung',
        },
        {
          id: faker.string.uuid(),
          accountId: faker.string.uuid(),
          accountCode: '2.1.4',
          accountName: 'Reisekosten Personal',
        },
        {
          id: faker.string.uuid(),
          accountId: faker.string.uuid(),
          accountCode: '2.1.5',
          accountName: 'Werkverträge',
        },
      ],
    };

    return of(group).pipe(delay(300));
  }
}
