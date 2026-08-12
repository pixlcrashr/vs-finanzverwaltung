import { Injectable, computed, signal } from '@angular/core';
import { Account, AccountGroupOperation } from '../../../shared/models';
import { AccountWithOperation } from './account-group-edit.data-service';

export interface AccountGroupRow {
  accountId: string;
  displayCode: string;
  displayName: string;
  fullCode: string;
  depth: number;
  isArchived: boolean;
  operation: AccountGroupOperation;
  account: Account;
}

@Injectable()
export class AccountGroupEditService {
  private readonly accountsWithOps = signal<AccountWithOperation[]>([]);

  setAccountsWithOperations(accounts: AccountWithOperation[]): void {
    this.accountsWithOps.set(accounts);
  }

  readonly maxDepth = computed(() => {
    const accounts = this.accountsWithOps();
    if (accounts.length === 0) return 0;
    return Math.max(...accounts.map(x => this.computeDepth(x.account)));
  });

  readonly accountCols = computed(() =>
    Array.from({ length: this.maxDepth() + 1 }, (_, i) => i)
  );

  private computeDepth(account: Account): number {
    return account.fullCode.split('.').length - 1;
  }

  readonly rows = computed((): AccountGroupRow[] => {
    const accounts = this.accountsWithOps();

    return accounts.map(item => ({
      accountId: item.account.id,
      displayCode: item.account.code,
      displayName: item.account.name,
      fullCode: item.account.fullCode,
      depth: this.computeDepth(item.account),
      isArchived: item.account.isArchived,
      operation: item.assignment?.operation ?? 'I',
      account: item.account,
    }));
  });
}
