import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';
import { Decimal } from 'decimal.js';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { BudgetRevisionServiceService } from '../../api/services/budget-revision-service.service';
import { BudgetAccountValueServiceService } from '../../api/services/budget-account-value-service.service';
import { BudgetRevisionAccountValueServiceService } from '../../api/services/budget-revision-account-value-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { BudgetTag } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
  BudgetChange,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';
import { mapApiBudget, mapApiBudgetTag, dateToTypeDate } from './_mappers';

@Injectable()
export class HttpBudgetEditDataService extends BudgetEditDataService {
  private readonly svc = inject(BudgetServiceService);
  private readonly revisionSvc = inject(BudgetRevisionServiceService);
  private readonly accountValueSvc = inject(BudgetAccountValueServiceService);
  private readonly revisionAccountValueSvc = inject(BudgetRevisionAccountValueServiceService);
  private readonly accountSvc = inject(AccountServiceService);

  private budgetName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/budgets/${uid}`;
  }

  override getBudget(organizationId: string, budgetId: string): Observable<BudgetDetails> {
    const name = this.budgetName(organizationId, budgetId);

    const budget$ = this.svc.BudgetServiceGetBudget(name);
    const revisions$ = this.revisionSvc.BudgetRevisionServiceListBudgetRevisions({
      parent: name,
      pageSize: 100,
      orderBy: 'create_time desc',
    });
    const currentValues$ = this.accountValueSvc.BudgetAccountValueServiceListBudgetAccountValues({
      parent: name,
      pageSize: 100,
    });

    return forkJoin({
      budget: budget$,
      revisions: revisions$,
      currentValues: currentValues$,
    }).pipe(
      switchMap(({ budget, revisions, currentValues }) => {
        const tags: BudgetTag[] = (revisions.revisions ?? []).map(mapApiBudgetTag);

        const currentMap = new Map<string, Decimal>();
        for (const av of currentValues.account_values ?? []) {
          currentMap.set(av.account_id, new Decimal(av.value?.value ?? '0'));
        }

        const latestRevision = revisions.revisions?.[0];

        if (!latestRevision?.name) {
          return of({
            ...mapApiBudget(budget),
            tags,
            hasUntaggedChanges: false,
            changes: [],
          });
        }

        return this.revisionAccountValueSvc
          .BudgetRevisionAccountValueServiceListBudgetRevisionAccountValues({
            parent1: latestRevision.name,
            pageSize: 200,
          })
          .pipe(
            switchMap((revisionValues) => {
              const revisionMap = new Map<string, Decimal>();
              for (const rav of revisionValues.account_values ?? []) {
                revisionMap.set(rav.account_id ?? '', new Decimal(rav.value?.value ?? '0'));
              }

              const changes: BudgetChange[] = [];
              const allAccountIds = new Set<string>([
                ...currentMap.keys(),
                ...revisionMap.keys(),
              ]);

              for (const accountId of allAccountIds) {
                const current = currentMap.get(accountId) ?? new Decimal(0);
                const revision = revisionMap.get(accountId) ?? new Decimal(0);
                const diff = current.minus(revision);
                if (!diff.equals(0)) {
                  changes.push({
                    accountId,
                    accountFullCode: '',
                    accountName: '',
                    previousValue: revision,
                    newValue: current,
                    diff,
                  });
                }
              }

              if (changes.length === 0) {
                return of({
                  ...mapApiBudget(budget),
                  tags,
                  hasUntaggedChanges: false,
                  changes,
                });
              }

              const orgParent = `organizations/${organizationId}`;
              return this.accountSvc.AccountServiceListAccounts({
                parent: orgParent,
                pageSize: 100,
              }).pipe(
                map((accountsResp) => {
                  const accountMap = new Map<string, { code: string; name: string }>();
                  for (const a of accountsResp.accounts ?? []) {
                    accountMap.set(a.uid ?? '', {
                      code: a.display_code ?? '',
                      name: a.display_name ?? '',
                    });
                  }
                  for (const c of changes) {
                    const info = accountMap.get(c.accountId);
                    if (info) {
                      c.accountFullCode = info.code;
                      c.accountName = info.name;
                    }
                  }
                  return {
                    ...mapApiBudget(budget),
                    tags,
                    hasUntaggedChanges: true,
                    changes,
                  };
                }),
              );
            }),
          );
      }),
    );
  }

  override createBudgetRevision(
    organizationId: string,
    budgetId: string,
    date: Date,
    name: string,
    description: string,
    _force: boolean,
  ): Observable<BudgetTag> {
    const parent = this.budgetName(organizationId, budgetId);
    return this.revisionSvc
      .BudgetRevisionServiceCreateBudgetRevision({
        parent,
        revision: {
          display_name: name,
          display_description: description,
          date: dateToTypeDate(date),
        },
      })
      .pipe(map(mapApiBudgetTag));
  }

  override deleteBudgetRevision(_organizationId: string, budgetRevisionId: string): Observable<void> {
    return of(void 0);
  }

  override updateBudgetRevision(_organizationId: string, _budgetRevisionId: string, _isPublished: boolean): Observable<void> {
    return of(void 0);
  }

  updateBudget(
    organizationId: string,
    budgetId: string,
    name: string,
    description: string,
    _publishCurrentTargetValuesAlways: boolean,
    _publishCurrentActualValuesAlways: boolean,
  ): Observable<void> {
    return this.svc
      .BudgetServiceUpdateBudget({
        budgetName: this.budgetName(organizationId, budgetId),
        budget: {
          display_name: name,
          display_description: description,
        } as any,
      })
      .pipe(map(() => undefined));
  }

  closeBudget(organizationId: string, budgetId: string): Observable<void> {
    return this.svc
      .BudgetServiceCloseBudget({ name: this.budgetName(organizationId, budgetId), body: {} })
      .pipe(map(() => undefined));
  }
}
