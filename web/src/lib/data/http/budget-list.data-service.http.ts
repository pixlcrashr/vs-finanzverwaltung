import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Budget } from '../../../app/shared/models';
import { BudgetListDataService } from '../../../app/routes/budgets/budget-list/budget-list.data-service';
import { mapApiBudget, dateToTypeDate } from './_mappers';

@Injectable()
export class HttpBudgetListDataService extends BudgetListDataService {
  private readonly svc = inject(BudgetServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private budgetName(uid: string): string {
    return `${this.parent}/budgets/${uid}`;
  }

  getBudgets(): Observable<Budget[]> {
    return this.svc.BudgetServiceListBudgets({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.budgets ?? []).map(mapApiBudget)),
    );
  }

  createBudget(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
  ): Observable<Budget> {
    return this.svc.BudgetServiceCreateBudget({
      parent: this.parent,
      budget: {
        display_name: name,
        display_description: description,
        period_start: dateToTypeDate(startDate),
        period_end: dateToTypeDate(endDate),
      },
    }).pipe(map(mapApiBudget));
  }

  deleteBudget(id: string): Observable<void> {
    return this.svc.BudgetServiceDeleteBudget(this.budgetName(id)).pipe(map(() => undefined));
  }
}
