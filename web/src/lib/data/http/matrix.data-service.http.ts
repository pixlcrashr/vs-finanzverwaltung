import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Decimal } from 'decimal.js';
import { AccountServiceService } from '../../api/services/account-service.service';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { BudgetRevisionServiceService } from '../../api/services/budget-revision-service.service';
import { BudgetRevisionAccountValueServiceService } from '../../api/services/budget-revision-account-value-service.service';
import { BudgetAccountValueServiceService } from '../../api/services/budget-account-value-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Account, Budget } from '../../../app/routes/matrix/matrix-data-provider.service';
import {
  MatrixDataService,
  MatrixTargetValues,
  MatrixActualValues,
  MatrixEditableValuesByBudget,
  MatrixBudgetValueUpdate,
} from '../../../app/routes/matrix/matrix.data-service';

@Injectable()
export class HttpMatrixDataService extends MatrixDataService {
  private readonly accountSvc = inject(AccountServiceService);
  private readonly budgetSvc = inject(BudgetServiceService);
  private readonly revisionSvc = inject(BudgetRevisionServiceService);
  private readonly revisionValueSvc = inject(BudgetRevisionAccountValueServiceService);
  private readonly budgetValueSvc = inject(BudgetAccountValueServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private budgetName(budgetId: string): string {
    return `${this.parent}/budgets/${budgetId}`;
  }

  getBudgets(): Observable<Budget[]> {
    return this.budgetSvc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }).pipe(
      switchMap((resp) => {
        const budgets = resp.budgets ?? [];
        if (budgets.length === 0) {
          return of([]);
        }
        return forkJoin(
          budgets.map((b) =>
            this.revisionSvc.BudgetRevisionServiceListBudgetRevisions({
              parent: this.budgetName(b.uid ?? ''),
              pageSize: 100,
              orderBy: 'create_time asc',
            }).pipe(
              map((revResp) => ({
                id: b.uid ?? '',
                displayName: b.display_name,
                displayDescription: b.display_description ?? '',
                isClosed: b.is_closed ?? false,
                tags: (revResp.revisions ?? []).map((r) => ({
                  id: r.uid ?? '',
                  displayName: r.display_name ?? '',
                  displayDescription: r.display_description ?? '',
                  createdAt: new Date(r.create_time ?? ''),
                })),
              })),
            ),
          ),
        );
      }),
    );
  }

  getAccounts(): Observable<Account[]> {
    return this.accountSvc
      .AccountServiceListAccounts({ parent: this.parent, pageSize: 500, showDeleted: true })
      .pipe(
        map((resp) => {
          const flat = resp.accounts ?? [];
          const accountMap = new Map<string, Account>();
          flat.forEach((a) => {
            accountMap.set(a.uid ?? '', {
              id: a.uid ?? '',
              name: a.display_name,
              displayCode: a.display_code,
              depth: 0,
              parentAccountId: a.parent_account ? a.parent_account.split('/').pop() ?? null : null,
              isArchived: a.is_archived ?? false,
            });
          });

          const computeDepth = (id: string, visited = new Set<string>()): number => {
            if (visited.has(id)) return 0;
            visited.add(id);
            const acc = accountMap.get(id);
            if (!acc || !acc.parentAccountId) return 0;
            return 1 + computeDepth(acc.parentAccountId, visited);
          };

          accountMap.forEach((acc) => {
            acc.depth = computeDepth(acc.id);
          });

          return Array.from(accountMap.values());
        }),
      );
  }

  getMatrixTargetValues(): Observable<MatrixTargetValues> {
    return this.budgetSvc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }).pipe(
      switchMap((resp) => {
        const budgets = resp.budgets ?? [];
        if (budgets.length === 0) {
          return of({} as MatrixTargetValues);
        }
        return forkJoin(
          budgets.map((b) =>
            this.revisionSvc.BudgetRevisionServiceListBudgetRevisions({
              parent: this.budgetName(b.uid ?? ''),
              pageSize: 100,
              orderBy: 'create_time asc',
            }).pipe(
              switchMap((revResp) => {
                const revisions = revResp.revisions ?? [];
                if (revisions.length === 0) {
                  return of([] as Array<{ tagId: string; accountId: string; value: Decimal }>);
                }
                return forkJoin(
                  revisions.map((r) =>
                    this.revisionValueSvc
                      .BudgetRevisionAccountValueServiceListBudgetRevisionAccountValues({
                        parent1: `${this.budgetName(b.uid ?? '')}/revisions/${r.uid ?? ''}`,
                        pageSize: 500,
                      })
                      .pipe(
                        map((valResp) =>
                          (valResp.account_values ?? []).map((v) => ({
                            tagId: r.uid ?? '',
                            accountId: v.account_id ?? '',
                            value: new Decimal(v.value?.value ?? '0'),
                          })),
                        ),
                      ),
                  ),
                ).pipe(map((arrays) => arrays.flat()));
              }),
            ),
          ),
        ).pipe(
          map((perBudget) => {
            const result: MatrixTargetValues = {};
            perBudget.flat().forEach(({ tagId, accountId, value }) => {
              if (!result[tagId]) result[tagId] = {};
              result[tagId][accountId] = { targetValue: value };
            });
            return result;
          }),
        );
      }),
    );
  }

  getMatrixActualValues(): Observable<MatrixActualValues> {
    return this.budgetSvc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }).pipe(
      switchMap((resp) => {
        const budgets = resp.budgets ?? [];
        if (budgets.length === 0) {
          return of({} as MatrixActualValues);
        }
        return forkJoin(
          budgets.map((b) =>
            this.budgetValueSvc
              .BudgetAccountValueServiceListBudgetAccountValues({
                parent: this.budgetName(b.uid ?? ''),
                pageSize: 500,
              })
              .pipe(
                map((valResp) => ({
                  budgetId: b.uid ?? '',
                  values: (valResp.account_values ?? []).map((v) => ({
                    accountId: v.account_id,
                    value: new Decimal(v.value?.value ?? '0'),
                  })),
                })),
              ),
          ),
        ).pipe(
          map((perBudget) => {
            const result: MatrixActualValues = {};
            perBudget.forEach(({ budgetId, values }) => {
              result[budgetId] = {};
              values.forEach(({ accountId, value }) => {
                result[budgetId][accountId] = { actualValue: value };
              });
            });
            return result;
          }),
        );
      }),
    );
  }

  getMatrixEditableValues(): Observable<MatrixEditableValuesByBudget[]> {
    return this.budgetSvc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }).pipe(
      switchMap((resp) => {
        const budgets = resp.budgets ?? [];
        if (budgets.length === 0) {
          return of([] as MatrixEditableValuesByBudget[]);
        }
        return forkJoin(
          budgets.map((b) =>
            this.budgetValueSvc
              .BudgetAccountValueServiceListBudgetAccountValues({
                parent: this.budgetName(b.uid ?? ''),
                pageSize: 500,
              })
              .pipe(
                map((valResp) => ({
                  budgetId: b.uid ?? '',
                  editableValues: Object.fromEntries(
                    (valResp.account_values ?? []).map((v) => [
                      v.account_id,
                      new Decimal(v.value?.value ?? '0'),
                    ]),
                  ),
                })),
              ),
          ),
        );
      }),
    );
  }

  updateMatrixBudgetValues(updates: MatrixBudgetValueUpdate[]): Observable<void> {
    if (updates.length === 0) {
      return of(undefined);
    }

    const byBudget = new Map<string, MatrixBudgetValueUpdate[]>();
    for (const update of updates) {
      const list = byBudget.get(update.budgetId) ?? [];
      list.push(update);
      byBudget.set(update.budgetId, list);
    }

    return forkJoin(
      Array.from(byBudget.entries()).map(([budgetId, budgetUpdates]) =>
        this.budgetValueSvc.BudgetAccountValueServiceBatchUpdateBudgetAccountValues({
          parent: this.budgetName(budgetId),
          body: {
            requests: budgetUpdates.map((u) => ({
              account_value: {
                name: `${this.budgetName(budgetId)}/accountValues/${u.accountId}`,
                account_id: u.accountId,
                value: { value: u.value.toString() },
              },
              allow_missing: true,
            })),
          },
        }),
      ),
    ).pipe(map(() => undefined));
  }
}
