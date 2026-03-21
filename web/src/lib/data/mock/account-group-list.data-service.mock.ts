import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AccountGroup } from '../../../app/shared/models';
import { AccountGroupListDataService } from '../../../app/routes/account-groups/account-group-list/account-group-list.data-service';

@Injectable()
export class MockAccountGroupListDataService extends AccountGroupListDataService {
  private groups: AccountGroup[] = this.generateGroups();

  getGroups(): Observable<AccountGroup[]> {
    return of([...this.groups]).pipe(delay(300));
  }

  createGroup(name: string, description: string): Observable<AccountGroup> {
    const newGroup: AccountGroup = {
      id: faker.string.uuid(),
      name,
      description,
      assignmentCount: 0,
    };

    this.groups = [newGroup, ...this.groups];
    return of(newGroup).pipe(delay(300));
  }

  deleteGroup(id: string): Observable<void> {
    this.groups = this.groups.filter((g) => g.id !== id);
    return of(undefined).pipe(delay(300));
  }

  private generateGroups(): AccountGroup[] {
    return [
      {
        id: faker.string.uuid(),
        name: 'Personalkosten',
        description: 'Alle personalbezogenen Konten',
        assignmentCount: 5,
      },
      {
        id: faker.string.uuid(),
        name: 'Sachmittel',
        description: 'Konten für Sachmittel und Material',
        assignmentCount: 8,
      },
      {
        id: faker.string.uuid(),
        name: 'Veranstaltungen',
        description: 'Veranstaltungsbezogene Konten',
        assignmentCount: 3,
      },
      {
        id: faker.string.uuid(),
        name: 'Verwaltung',
        description: 'Administrative Konten',
        assignmentCount: 4,
      },
    ];
  }
}
