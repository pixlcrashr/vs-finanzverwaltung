import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listBudgets,
  createBudget,
  deleteBudget,
} from '../../api/functions';
import { Budget } from '../../../app/shared/models';
import { BudgetListDataService } from '../../../app/routes/budgets/budget-list/budget-list.data-service';
import { mapApiBudget, toDateOnly } from './_mappers';

@Injectable()
export class HttpBudgetListDataService extends BudgetListDataService {
  private readonly api = inject(Api);

  getBudgets(): Observable<Budget[]> {
    return from(
      this.api.invoke(listBudgets, { pageSize: 100 }),
    ).pipe(map((resp) => (resp.budgets ?? []).map(mapApiBudget)));
  }

  createBudget(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
  ): Observable<Budget> {
    return from(
      this.api.invoke(createBudget, {
        body: {
          displayName: name,
          displayDescription: description,
          periodStart: startDate.toISOString().split('T')[0],
          periodEnd: endDate.toISOString().split('T')[0]
        },
      }),
    ).pipe(map(mapApiBudget));
  }

  deleteBudget(id: string): Observable<void> {
    return from(
      this.api.invoke(deleteBudget, { budgetId: id }),
    ).pipe(map(() => undefined));
  }
}
