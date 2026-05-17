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
import { BudgetRevision, BudgetTag } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';
import { mapApiBudget, mapApiBudgetRevision, toDateOnly } from './_mappers';

@Injectable()
export class HttpBudgetEditDataService extends BudgetEditDataService {
  private readonly api = inject(Api);
  private currentBudgetId = '';

  override getBudget(id: string): Observable<BudgetDetails> {
    throw new Error('Method not implemented.');
  }

  override addTag(budgetId: string, date: Date, name: string, description: string, force: boolean): Observable<BudgetTag> {
    throw new Error('Method not implemented.');
  }

  override deleteTag(id: string): Observable<void> {
    throw new Error('Method not implemented.');
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

  closeBudget(id: string): Observable<void> {
    return from(
      this.api.invoke(closeBudget, { budgetId: id }),
    ).pipe(map(() => undefined));
  }
}
