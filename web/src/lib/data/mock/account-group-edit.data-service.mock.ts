import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Account, AccountGroupOperation } from '../../../app/shared/models';
import {
  AccountGroupEditDataService,
  AccountGroupDetails,
  AccountWithOperation,
} from '../../../app/routes/account-groups/account-group-edit/account-group-edit.data-service';

@Injectable()
export class MockAccountGroupEditDataService extends AccountGroupEditDataService {
  private allAccounts: Account[];

  constructor() {
    super();
    // Create root accounts (depth 0)
    const root1 = this.createAccount('1', '1', 'Aktiva', 0, null, false);
    const root2 = this.createAccount('2', '2', 'Passiva', 0, null, false);
    const root3 = this.createAccount('3', '3', 'Archiviert', 0, null, true);

    // Create level 1 accounts (depth 1)
    const acc1_1 = this.createAccount('1.1', '1.1', 'Kasse', 1, root1.id, false);
    const acc1_2 = this.createAccount('1.2', '1.2', 'Bank', 1, root1.id, false);
    const acc2_1 = this.createAccount('2.1', '2.1', 'Personal', 1, root2.id, false);
    const acc2_2 = this.createAccount('2.2', '2.2', 'Sachkosten', 1, root2.id, false);

    // Create level 2 accounts (depth 2)
    const acc2_1_1 = this.createAccount('2.1.1', '2.1.1', 'Gehälter', 2, acc2_1.id, false);
    const acc2_1_2 = this.createAccount('2.1.2', '2.1.2', 'Sozialabgaben', 2, acc2_1.id, false);
    const acc2_1_3 = this.createAccount('2.1.3', '2.1.3', 'Weiterbildung', 2, acc2_1.id, false);
    const acc2_2_1 = this.createAccount('2.2.1', '2.2.1', 'Büromaterial', 2, acc2_2.id, false);
    const acc2_2_2 = this.createAccount('2.2.2', '2.2.2', 'IT-Ausstattung', 2, acc2_2.id, false);

    // Archived accounts
    const acc3_1 = this.createAccount('3.1', '3.1', 'Altes Konto', 1, root3.id, true);
    const acc3_2 = this.createAccount('3.2', '3.2', 'Nicht mehr verwendet', 1, root3.id, true);

    this.allAccounts = [
      root1, acc1_1, acc1_2,
      root2, acc2_1, acc2_1_1, acc2_1_2, acc2_1_3,
      acc2_2, acc2_2_1, acc2_2_2,
      root3, acc3_1, acc3_2,
    ];
  }

  private get groupData(): AccountGroupDetails {
    return {
      id: faker.string.uuid(),
      name: 'Personalkosten',
      description: 'Alle personalbezogenen Konten',
      assignmentCount: 3,
      assignments: [
        {
          id: faker.string.uuid(),
          accountId: this.allAccounts.find(a => a.code === '2.1.1')!.id,
          accountCode: '2.1.1',
          accountName: 'Gehälter',
          operation: 'A',
          targetValue: '0',
          actualValue: '0',
        },
        {
          id: faker.string.uuid(),
          accountId: this.allAccounts.find(a => a.code === '2.1.2')!.id,
          accountCode: '2.1.2',
          accountName: 'Sozialabgaben',
          operation: 'A',
          targetValue: '0',
          actualValue: '0',
        },
        {
          id: faker.string.uuid(),
          accountId: this.allAccounts.find(a => a.code === '2.1.3')!.id,
          accountCode: '2.1.3',
          accountName: 'Weiterbildung',
          operation: 'S',
          targetValue: '0',
          actualValue: '0',
        },
      ],
    };
  }

  private savedGroupData: AccountGroupDetails | null = null;

  getGroup(id: string): Observable<AccountGroupDetails> {
    if (!this.savedGroupData) {
      this.savedGroupData = { ...this.groupData, id };
    }
    return of({ ...this.savedGroupData }).pipe(delay(300));
  }

  updateGroup(id: string, name: string, description: string): Observable<AccountGroupDetails> {
    if (this.savedGroupData) {
      this.savedGroupData.name = name;
      this.savedGroupData.description = description;
    }
    return of({ ...this.groupData, id, name, description }).pipe(delay(300));
  }

  getAllAccountsWithOperations(groupId: string): Observable<AccountWithOperation[]> {
    const accountsWithOps: AccountWithOperation[] = this.allAccounts.map((account) => {
      const assignment = this.groupData.assignments.find((a) => a.accountId === account.id) || null;
      return { account, assignment };
    });
    return of(accountsWithOps).pipe(delay(200));
  }

  updateAccountOperation(groupId: string, accountId: string, operation: AccountGroupOperation): Observable<void> {
    if (!this.savedGroupData) {
      this.savedGroupData = { ...this.groupData };
    }

    const existingIndex = this.savedGroupData.assignments.findIndex((a) => a.accountId === accountId);
    const account = this.allAccounts.find((a) => a.id === accountId);

    if (!account) {
      return of(undefined).pipe(delay(100));
    }

    if (operation === 'I') {
      // Remove assignment if set to 'I' (ignored)
      if (existingIndex !== -1) {
        this.savedGroupData.assignments.splice(existingIndex, 1);
        this.savedGroupData.assignmentCount--;
      }
    } else {
      // Add or update assignment for 'A' or 'S'
      if (existingIndex !== -1) {
        this.savedGroupData.assignments[existingIndex].operation = operation;
      } else {
        this.savedGroupData.assignments.push({
          id: faker.string.uuid(),
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          operation,
          targetValue: '0',
          actualValue: '0',
        });
        this.savedGroupData.assignmentCount++;
      }
    }

    return of(undefined).pipe(delay(200));
  }

  deleteGroup(id: string): Observable<void> {
    // Simulate deletion with delay
    return of(undefined).pipe(delay(500));
  }

  private createAccount(
    code: string,
    fullCode: string,
    name: string,
    depth: number,
    parentAccountId: string | null,
    isArchived: boolean
  ): Account {
    return {
      id: faker.string.uuid(),
      code,
      fullCode,
      name,
      description: '',
      depth,
      isArchived,
      parentAccountId,
      children: [],
    };
  }
}
