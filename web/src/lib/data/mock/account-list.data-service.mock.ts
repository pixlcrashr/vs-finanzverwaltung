import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Account } from '../../../app/shared/models';
import { AccountListDataService } from '../../../app/routes/accounts/account-list/account-list.data-service';

@Injectable()
export class MockAccountListDataService extends AccountListDataService {
  private accounts: Account[] = this.generateAccounts();

  getAccounts(): Observable<Account[]> {
    return of([...this.accounts]).pipe(delay(300));
  }

  createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null
  ): Observable<Account> {
    const newAccount: Account = {
      id: faker.string.uuid(),
      name,
      code,
      description,
      depth: parentAccountId ? 1 : 0,
      isArchived: false,
      parentAccountId,
      children: [],
    };

    if (parentAccountId) {
      const parent = this.findAccount(this.accounts, parentAccountId);
      if (parent) {
        parent.children.push(newAccount);
      }
    } else {
      this.accounts = [newAccount, ...this.accounts];
    }

    return of(newAccount).pipe(delay(300));
  }

  deleteAccount(id: string): Observable<void> {
    this.accounts = this.removeAccount(this.accounts, id);
    return of(undefined).pipe(delay(300));
  }

  archiveAccount(id: string): Observable<void> {
    const account = this.findAccount(this.accounts, id);
    if (account) {
      account.isArchived = true;
    }
    return of(undefined).pipe(delay(300));
  }

  restoreAccount(id: string): Observable<void> {
    const account = this.findAccount(this.accounts, id);
    if (account) {
      account.isArchived = false;
    }
    return of(undefined).pipe(delay(300));
  }

  private findAccount(accounts: Account[], id: string): Account | null {
    for (const account of accounts) {
      if (account.id === id) {
        return account;
      }
      const found = this.findAccount(account.children, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private removeAccount(accounts: Account[], id: string): Account[] {
    return accounts
      .filter((a) => a.id !== id)
      .map((a) => ({
        ...a,
        children: this.removeAccount(a.children, id),
      }));
  }

  private generateAccounts(): Account[] {
    const rootAccounts: Account[] = [
      this.createAccountNode('1', 'Einnahmen', 'Alle Einnahmen', 0),
      this.createAccountNode('2', 'Ausgaben', 'Alle Ausgaben', 0),
      this.createAccountNode('3', 'Rücklagen', 'Rücklagen und Reserven', 0),
    ];

    // Add children to Einnahmen
    rootAccounts[0].children = [
      this.createAccountNode('1.1', 'Mitgliedsbeiträge', 'Einnahmen aus Mitgliedsbeiträgen', 1),
      this.createAccountNode('1.2', 'Zuschüsse', 'Öffentliche Zuschüsse', 1),
      this.createAccountNode('1.3', 'Spenden', 'Spendeneinnahmen', 1),
    ];

    // Add children to Ausgaben
    rootAccounts[1].children = [
      this.createAccountNode('2.1', 'Personal', 'Personalkosten', 1),
      this.createAccountNode('2.2', 'Sachmittel', 'Sachmittel und Material', 1),
      this.createAccountNode('2.3', 'Veranstaltungen', 'Veranstaltungskosten', 1),
      this.createAccountNode('2.4', 'Verwaltung', 'Verwaltungskosten', 1, true),
    ];

    // Add sub-children to Personal
    rootAccounts[1].children[0].children = [
      this.createAccountNode('2.1.1', 'Gehälter', 'Gehaltszahlungen', 2),
      this.createAccountNode('2.1.2', 'Sozialabgaben', 'Arbeitgeberanteile Sozialversicherung', 2),
    ];

    return rootAccounts;
  }

  private createAccountNode(
    code: string,
    name: string,
    description: string,
    depth: number,
    isArchived = false
  ): Account {
    return {
      id: faker.string.uuid(),
      code,
      name,
      description,
      depth,
      isArchived,
      parentAccountId: null,
      children: [],
    };
  }
}
