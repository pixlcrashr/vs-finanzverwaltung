import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { CreateBudgetDialogDataService } from '../../../app/shared/dialogs/create-budget-dialog/create-budget-dialog.data-service';
import { CreatedBudget } from '../../../app/shared/dialogs/create-budget-dialog/create-budget-dialog.component';
import { dateToTypeDate, typeDateToDate } from './_mappers';

@Injectable()
export class HttpCreateBudgetDialogDataService extends CreateBudgetDialogDataService {
  private readonly svc = inject(BudgetServiceService);

  createBudget(
    organizationId: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
  ): Observable<CreatedBudget> {
    const parent = `organizations/${organizationId}`;
    return this.svc.BudgetServiceCreateBudget({
      parent,
      budget: {
        display_name: name,
        display_description: description,
        period_start: dateToTypeDate(startDate),
        period_end: dateToTypeDate(endDate),
      },
    }).pipe(
      map((b) => ({
        id: b.uid ?? '',
        name: b.display_name,
        description: b.display_description ?? '',
        periodStart: typeDateToDate(b.period_start),
        periodEnd: typeDateToDate(b.period_end),
      })),
    );
  }
}
