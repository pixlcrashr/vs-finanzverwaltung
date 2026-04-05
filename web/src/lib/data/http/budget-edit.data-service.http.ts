import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { Api } from '../../api/api';
import {
  getBudget,
  updateBudget,
  closeBudget,
  listBudgetRevisions,
  createBudgetRevision,
  updateBudgetRevision,
  deleteBudgetRevision,
} from '../../api/functions';
import { BudgetRevision } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';
import { mapApiBudget, mapApiBudgetRevision, toDateOnly } from './_mappers';

@Injectable()
export class HttpBudgetEditDataService extends BudgetEditDataService {
  private readonly api = inject(Api);
  private currentBudgetId = '';

  getBudget(id: string): Observable<BudgetDetails> {
    this.currentBudgetId = id;
    return from(
      Promise.all([
        this.api.invoke(getBudget, { budgetId: id }),
        this.api.invoke(listBudgetRevisions, { budgetId: id, pageSize: 100 }),
      ]),
    ).pipe(
      map(([budget, revisionsResp]) => ({
        ...mapApiBudget(budget),
        revisions: (revisionsResp.revisions ?? []).map(mapApiBudgetRevision),
      })),
    );
  }

  updateBudget(
    id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
  ): Observable<void> {
    return from(
      this.api.invoke(updateBudget, {
        budgetId: id,
        body: {
          displayName: name,
          displayDescription: description,
          periodStart: toDateOnly(startDate),
          periodEnd: toDateOnly(endDate),
        },
      }),
    ).pipe(map(() => undefined));
  }

  addRevision(budgetId: string, date: Date, description: string): Observable<BudgetRevision> {
    return from(
      this.api.invoke(createBudgetRevision, {
        budgetId,
        body: {
          date: toDateOnly(date),
          displayDescription: description,
        },
      }),
    ).pipe(map(mapApiBudgetRevision));
  }

  updateRevision(id: string, date: Date, description: string): Observable<void> {
    return from(
      this.api.invoke(updateBudgetRevision, {
        budgetId: this.currentBudgetId,
        revisionId: id,
        body: {
          date: toDateOnly(date),
          displayDescription: description,
        },
      }),
    ).pipe(map(() => undefined));
  }

  deleteRevision(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteBudgetRevision, {
        budgetId: this.currentBudgetId,
        revisionId: id,
      }),
    ).pipe(map(() => undefined));
  }

  closeBudget(id: string): Observable<void> {
    return from(
      this.api.invoke(closeBudget, { budgetId: id }),
    ).pipe(map(() => undefined));
  }
}
