import { inject, Injectable, computed, Signal } from '@angular/core';
import { MatrixDataService } from './matrix.data-service';
import { MatrixValueStoreService } from './matrix-value-store.service';
import { forkJoin, map, Observable, tap } from 'rxjs';
import { Decimal } from 'decimal.js';



export interface BudgetTag {
  id: string;
  displayName: string;
  displayDescription: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  displayName: string;
  displayDescription: string;
  isClosed: boolean;
  tags: BudgetTag[];
}

export interface Account {
  id: string;
  name: string;
  displayCode: string;
  depth: number;
  parentAccountId: string | null;
  isArchived: boolean;
}

export interface MatrixColumn {
  budgetId: string;
  displayName: string;
  displayDescription: string;
  date: Date;
  revisions: {
    revisionId: string;
    createdAt: Date;
  }[];
}

export interface MatrixRow {
  accountId: string;
  depth: number;
  displayName: string;
  displayCode: string;
  displayDescription: string;
  isSumRow?: boolean;
  sourceAccountId?: string;
  values: {
    budgetId: string;
    revisions: {
      revisionId: string;
      targetValue: Signal<Decimal>;
      actualValue: Signal<Decimal>;
      diffValue: Signal<Decimal>;
    }[];
  }[]
}

export interface MatrixData {
  columns: MatrixColumn[];
  rows: MatrixRow[];
  accounts: Account[];
  budgets: Budget[];
}

@Injectable()
export class MatrixDataProviderService {
  private matrixDataService = inject(MatrixDataService);
  private valueStore = inject(MatrixValueStoreService);

  private isLeafAccount(account: Account, accounts: Account[]): boolean {
    return !accounts.some(a => a.parentAccountId === account.id);
  }

  getMatrixData(): Observable<MatrixData> {
    return forkJoin([
      this.matrixDataService.getBudgets(),
      this.matrixDataService.getAccounts(),
      this.matrixDataService.getMatrixTargetValues(),
      this.matrixDataService.getMatrixActualValues()
    ]).pipe(
      tap(([budgets, accounts, targetValues, actualValues]) => {
        const accountById = new Map(accounts.map(account => [account.id, account]));

        // Populate value store
        Object.entries(targetValues).forEach(([tagId, accountMap]) => {
          Object.entries(accountMap).forEach(([accountId, value]) => {
            const budget = budgets.find(b => b.tags.some(t => t.id === tagId));
            const account = accountById.get(accountId);
            if (budget && account && this.isLeafAccount(account, accounts)) {
              this.valueStore.updateTargetValue(budget.id, accountId, tagId, value.targetValue);
            }
          });
        });

        Object.entries(actualValues).forEach(([budgetId, accountMap]) => {
          Object.entries(accountMap).forEach(([accountId, value]) => {
            const budget = budgets.find(b => b.id === budgetId);
            const account = accountById.get(accountId);
            if (budget && account && this.isLeafAccount(account, accounts) && budget.tags.length > 0) {
              budget.tags.forEach(tag => {
                this.valueStore.updateActualValue(budgetId, accountId, tag.id, value.actualValue);
              });
            }
          });
        });

        const depthSortedAccounts = [...accounts].sort((a, b) => b.depth - a.depth);
        depthSortedAccounts.forEach(account => {
          const children = accounts.filter(a => a.parentAccountId === account.id);
          if (children.length === 0) {
            return;
          }

          budgets.forEach(budget => {
            budget.tags.forEach(tag => {
              const targetChildren = children.map(child =>
                this.valueStore.getTargetValue(budget.id, child.id, tag.id)
              );
              const actualChildren = children.map(child =>
                this.valueStore.getActualValue(budget.id, child.id, tag.id)
              );

              this.valueStore.setTargetAggregateValue(budget.id, account.id, tag.id, targetChildren);
              this.valueStore.setActualAggregateValue(budget.id, account.id, tag.id, actualChildren);
            });
          });
        });
      }),
      map(([budgets, accounts]) => {
        const columns: MatrixColumn[] = budgets.map(budget => ({
          budgetId: budget.id,
          displayName: budget.displayName,
          displayDescription: budget.displayDescription,
          date: new Date(), // Mock date
          revisions: budget.tags.map(tag => ({
            revisionId: tag.id,
            createdAt: tag.createdAt
          }))
        }));

        const rows: MatrixRow[] = accounts.map(account => {
          return {
            accountId: account.id,
            depth: account.depth,
            displayCode: account.displayCode,
            displayName: account.name,
            displayDescription: '', // Could be filled if Account had a description
            values: budgets.map(budget => ({
              budgetId: budget.id,
              revisions: budget.tags.map(tag => {
                const targetVal = this.valueStore.getTargetValue(budget.id, account.id, tag.id);
                const actualVal = this.valueStore.getActualValue(budget.id, account.id, tag.id);
                
                return {
                  revisionId: tag.id,
                  targetValue: targetVal,
                  actualValue: actualVal,
                  diffValue: computed(() => targetVal().minus(actualVal()))
                };
              })
            }))
          };
        });

        const rowByAccountId = new Map(rows.map(row => [row.accountId, row]));
        const childrenByParentId = new Map<string | null, Account[]>();

        accounts.forEach(account => {
          const key = account.parentAccountId;
          const siblings = childrenByParentId.get(key) ?? [];
          siblings.push(account);
          childrenByParentId.set(key, siblings);
        });

        const visited = new Set<string>();
        const buildRowsForAccount = (account: Account): MatrixRow[] => {
          const row = rowByAccountId.get(account.id);
          if (!row) {
            return [];
          }

          visited.add(account.id);

          const children = childrenByParentId.get(account.id) ?? [];
          if (children.length === 0) {
            return [row];
          }

          const descendants = children.flatMap(child => buildRowsForAccount(child));

          const sumRow: MatrixRow = {
            accountId: `${row.accountId}__sum`,
            sourceAccountId: row.accountId,
            depth: row.depth,
            displayCode: row.displayCode,
            displayName: `Summe ${row.displayName}`,
            displayDescription: row.displayDescription,
            isSumRow: true,
            values: row.values
          };

          return [row, ...descendants, sumRow];
        };

        const rootAccounts = childrenByParentId.get(null) ?? [];
        const rowsWithSums = rootAccounts.flatMap(root => buildRowsForAccount(root));

        rows.forEach(row => {
          if (!visited.has(row.accountId)) {
            rowsWithSums.push(row);
          }
        });

        return {
          columns,
          rows: rowsWithSums,
          budgets,
          accounts
        };
      })
    );
  }
}
