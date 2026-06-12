import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AccountGroup } from '../../../app/shared/models';
import { AccountGroupListDataService } from '../../../app/routes/account-groups/account-group-list/account-group-list.data-service';

@Injectable()
export class MockAccountGroupListDataService extends AccountGroupListDataService {
  private groupsByOrg = new Map<string, AccountGroup[]>();

  private getGroups(organizationId: string): AccountGroup[] {
    if (!this.groupsByOrg.has(organizationId)) {
      this.groupsByOrg.set(organizationId, this.generateGroups());
    }
    return this.groupsByOrg.get(organizationId)!;
  }

  listGroups(organizationId: string): Observable<AccountGroup[]> {
    return of([...this.getGroups(organizationId)]).pipe(delay(300));
  }

  createGroup(organizationId: string, name: string, description: string): Observable<AccountGroup> {
    const groups = this.getGroups(organizationId);
    const newGroup: AccountGroup = {
      id: faker.string.uuid(),
      name,
      description,
      assignmentCount: 0,
    };

    groups.unshift(newGroup);
    return of(newGroup).pipe(delay(300));
  }

  deleteGroup(organizationId: string, id: string): Observable<void> {
    const groups = this.getGroups(organizationId);
    this.groupsByOrg.set(organizationId, groups.filter((g) => g.id !== id));
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
