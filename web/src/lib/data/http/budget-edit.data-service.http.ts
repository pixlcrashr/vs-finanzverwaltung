import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { BudgetRevisionServiceService } from '../../api/services/budget-revision-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { BudgetRevision, BudgetTag } from '../../../app/shared/models';
import {
  BudgetEditDataService,
  BudgetDetails,
} from '../../../app/routes/budgets/budget-edit/budget-edit.data-service';
import { mapApiBudget, mapApiBudgetRevision, dateToTypeDate } from './_mappers';

@Injectable()
export class HttpBudgetEditDataService extends BudgetEditDataService {
  private readonly svc = inject(BudgetServiceService);
  private readonly revisionSvc = inject(BudgetRevisionServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private budgetName(uid: string): string {
    return `${this.parent}/budgets/${uid}`;
  }

  override getBudget(id: string): Observable<BudgetDetails> {
    return this.svc.BudgetServiceGetBudget(this.budgetName(id)).pipe(
      map((b) => ({
        ...mapApiBudget(b),
        tags: [],
        hasUntaggedChanges: false,
        changes: [],
      })),
    );
  }

  override addTag(budgetId: string, date: Date, name: string, description: string, _force: boolean): Observable<BudgetTag> {
    // TODO: No tag API endpoint yet; create a revision as a proxy
    return throwError(() => new Error('Budget tags API is not yet implemented.'));
  }

  override deleteTag(_id: string): Observable<void> {
    return throwError(() => new Error('Budget tags API is not yet implemented.'));
  }

  override updateTagPublication(_id: string, _isPublished: boolean): Observable<void> {
    return throwError(() => new Error('Budget tags API is not yet implemented.'));
  }

  updateBudget(
    id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
    _publishCurrentTargetValuesAlways: boolean,
    _publishCurrentActualValuesAlways: boolean,
  ): Observable<void> {
    return this.svc.BudgetServiceUpdateBudget({
      budgetName: this.budgetName(id),
      budget: {
        display_name: name,
        display_description: description,
        period_start: dateToTypeDate(startDate),
        period_end: dateToTypeDate(endDate),
      },
    }).pipe(map(() => undefined));
  }

  closeBudget(id: string): Observable<void> {
    return this.svc.BudgetServiceCloseBudget({ name: this.budgetName(id), body: {} }).pipe(map(() => undefined));
  }
}
