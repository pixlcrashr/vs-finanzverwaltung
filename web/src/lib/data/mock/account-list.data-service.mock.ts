import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { Account } from '../../../app/shared/models';
import { AccountListDataService } from '../../../app/routes/accounts/account-list/account-list.data-service';

@Injectable()
export class MockAccountListDataService extends AccountListDataService {
  private accountsByOrg = new Map<string, Account[]>();

  private getAccounts(organizationId: string): Account[] {
    if (!this.accountsByOrg.has(organizationId)) {
      this.accountsByOrg.set(organizationId, this.generateAccounts());
    }
    return this.accountsByOrg.get(organizationId)!;
  }

  listAccounts(organizationId: string): Observable<Account[]> {
    return of([...this.getAccounts(organizationId)]).pipe(delay(300));
  }

  createAccount(
    organizationId: string,
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null,
    isContainer: boolean,
  ): Observable<Account> {
    const accounts = this.getAccounts(organizationId);
    const newAccount: Account = {
      id: faker.string.uuid(),
      name,
      code,
      fullCode: code,
      description,
      depth: parentAccountId ? 1 : 0,
      isArchived: false,
      parentAccountId,
      children: [],
    };

    if (parentAccountId) {
      const parent = this.findAccount(accounts, parentAccountId);
      if (parent) {
        parent.children.push(newAccount);
      }
    } else {
      accounts.unshift(newAccount);
    }

    return of(newAccount).pipe(delay(300));
  }

  deleteAccount(organizationId: string, id: string): Observable<void> {
    this.accountsByOrg.set(organizationId, this.removeAccount(this.getAccounts(organizationId), id));
    return of(undefined).pipe(delay(300));
  }

  archiveAccount(organizationId: string, id: string): Observable<void> {
    const account = this.findAccount(this.getAccounts(organizationId), id);
    if (account) {
      account.isArchived = true;
    }
    return of(undefined).pipe(delay(300));
  }

  restoreAccount(organizationId: string, id: string): Observable<void> {
    const account = this.findAccount(this.getAccounts(organizationId), id);
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
      fullCode: code,
      name,
      description,
      depth,
      isArchived,
      parentAccountId: null,
      children: [],
    };
  }
}
