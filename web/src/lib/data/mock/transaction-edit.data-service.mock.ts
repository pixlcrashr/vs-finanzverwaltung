import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Transaction, Account } from '../../../app/shared/models';
import { TransactionEditDataService } from '../../../app/routes/transactions/transaction-edit/transaction-edit.data-service';

@Injectable()
export class MockTransactionEditDataService extends TransactionEditDataService {
  private transaction: Transaction = {
    id: faker.string.uuid(),
    documentDate: faker.date.recent({ days: 30 }),
    bookedAt: new Date(),
    updatedAt: new Date(),
    amount: '1500.00',
    debitAccountId: faker.string.uuid(),
    debitAccountCode: '1100',
    debitAccountName: 'Bank',
    creditAccountId: faker.string.uuid(),
    creditAccountCode: '3100',
    creditAccountName: 'Mitgliedsbeiträge',
    description: 'Mitgliedsbeitrag Q1',
    assignedAccountId: null,
    accountAssignments: [
      {
        id: faker.string.uuid(),
        accountId: faker.string.uuid(),
        accountCode: '2.1.1',
        accountName: 'Gehälter',
        value: '1000.00',
      },
      {
        id: faker.string.uuid(),
        accountId: faker.string.uuid(),
        accountCode: '2.1.2',
        accountName: 'Sozialabgaben',
        value: '500.00',
      },
    ],
  };

  getTransaction(id: string): Observable<Transaction> {
    return of({ ...this.transaction, id }).pipe(delay(300));
  }

  updateTransaction(id: string, description: string): Observable<Transaction> {
    this.transaction.description = description;
    this.transaction.updatedAt = new Date();
    return of({ ...this.transaction, id }).pipe(delay(300));
  }

  getAvailableAccounts(): Observable<Account[]> {
    return of([
      this.createAccount('2.1.3', 'Weiterbildung'),
      this.createAccount('2.2.1', 'Büromaterial'),
      this.createAccount('2.2.2', 'IT-Ausstattung'),
      this.createAccount('2.3.1', 'Veranstaltungsräume'),
    ]).pipe(delay(200));
  }

  addAssignment(transactionId: string, accountId: string, value: string): Observable<void> {
    this.transaction.accountAssignments.push({
      id: faker.string.uuid(),
      accountId,
      accountCode: '2.1.3',
      accountName: 'Neues Konto',
      value,
    });
    return of(undefined).pipe(delay(300));
  }

  removeAssignment(transactionId: string, assignmentId: string): Observable<void> {
    this.transaction.accountAssignments = this.transaction.accountAssignments.filter(
      (a) => a.id !== assignmentId
    );
    return of(undefined).pipe(delay(300));
  }

  private createAccount(code: string, name: string): Account {
    return {
      id: faker.string.uuid(),
      code,
      fullCode: code,
      name,
      description: '',
      depth: 1,
      isArchived: false,
      parentAccountId: null,
      children: [],
    };
  }
}
