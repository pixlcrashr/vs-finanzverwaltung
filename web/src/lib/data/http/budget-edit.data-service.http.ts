import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { BudgetRevisionServiceService } from '../../api/services/budget-revision-service.service';
import { BudgetTag } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';
import { mapApiBudget, mapApiBudgetRevision, dateToTypeDate } from './_mappers';

@Injectable()
export class HttpBudgetEditDataService extends BudgetEditDataService {
  private readonly svc = inject(BudgetServiceService);
  private readonly revisionSvc = inject(BudgetRevisionServiceService);

  private budgetName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/budgets/${uid}`;
  }

  override getBudget(organizationId: string, budgetId: string): Observable<BudgetDetails> {
    return this.svc.BudgetServiceGetBudget(this.budgetName(organizationId, budgetId)).pipe(
      map((b) => ({
        ...mapApiBudget(b),
        tags: [],
        hasUntaggedChanges: false,
        changes: [],
      })),
    );
  }

  override createBudgetRevision(_organizationId: string, _budgetId: string, _date: Date, _name: string, _description: string, _force: boolean): Observable<BudgetTag> {
    return throwError(() => new Error('Budget revision API is not yet implemented.'));
  }

  override deleteBudgetRevision(_organizationId: string, _budgetRevisionId: string): Observable<void> {
    return throwError(() => new Error('Budget revision API is not yet implemented.'));
  }

  override updateBudgetRevision(_organizationId: string, _budgetRevisionId: string, _isPublished: boolean): Observable<void> {
    return throwError(() => new Error('Budget revision API is not yet implemented.'));
  }

  updateBudget(
    organizationId: string,
    budgetId: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
    _publishCurrentTargetValuesAlways: boolean,
    _publishCurrentActualValuesAlways: boolean,
  ): Observable<void> {
    return this.svc.BudgetServiceUpdateBudget({
      budgetName: this.budgetName(organizationId, budgetId),
      budget: {
        display_name: name,
        display_description: description,
        period_start: dateToTypeDate(startDate),
        period_end: dateToTypeDate(endDate),
      },
    }).pipe(map(() => undefined));
  }

  closeBudget(organizationId: string, budgetId: string): Observable<void> {
    return this.svc.BudgetServiceCloseBudget({ name: this.budgetName(organizationId, budgetId), body: {} }).pipe(map(() => undefined));
  }
}
