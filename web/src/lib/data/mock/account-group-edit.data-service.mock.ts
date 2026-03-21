import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Account } from '../../../app/shared/models';
import {
  AccountGroupEditDataService,
  AccountGroupDetails,
} from '../../../app/routes/account-groups/account-group-edit/account-group-edit.data-service';

@Injectable()
export class MockAccountGroupEditDataService extends AccountGroupEditDataService {
  private groupData: AccountGroupDetails = {
    id: faker.string.uuid(),
    name: 'Personalkosten',
    description: 'Alle personalbezogenen Konten',
    assignmentCount: 5,
    assignments: [
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
    ],
  };

  getGroup(id: string): Observable<AccountGroupDetails> {
    return of({ ...this.groupData, id }).pipe(delay(300));
  }

  updateGroup(id: string, name: string, description: string): Observable<AccountGroupDetails> {
    this.groupData.name = name;
    this.groupData.description = description;
    return of({ ...this.groupData, id }).pipe(delay(300));
  }

  getAvailableAccounts(): Observable<Account[]> {
    const accounts: Account[] = [
      this.createAccount('2.1.4', 'Reisekosten Personal'),
      this.createAccount('2.1.5', 'Werkverträge'),
      this.createAccount('2.2.1', 'Büromaterial'),
      this.createAccount('2.2.2', 'IT-Ausstattung'),
      this.createAccount('2.3.1', 'Veranstaltungsräume'),
    ];
    return of(accounts).pipe(delay(200));
  }

  addAssignment(groupId: string, accountId: string): Observable<void> {
    const newAssignment = {
      id: faker.string.uuid(),
      accountId,
      accountCode: '2.1.4',
      accountName: 'Neues Konto',
    };
    this.groupData.assignments.push(newAssignment);
    this.groupData.assignmentCount++;
    return of(undefined).pipe(delay(300));
  }

  removeAssignment(groupId: string, assignmentId: string): Observable<void> {
    this.groupData.assignments = this.groupData.assignments.filter((a) => a.id !== assignmentId);
    this.groupData.assignmentCount--;
    return of(undefined).pipe(delay(300));
  }

  private createAccount(code: string, name: string): Account {
    return {
      id: faker.string.uuid(),
      code,
      name,
      description: '',
      depth: 1,
      isArchived: false,
      parentAccountId: null,
      children: [],
    };
  }
}
