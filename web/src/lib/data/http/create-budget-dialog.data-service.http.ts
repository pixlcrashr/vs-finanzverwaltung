import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { createBudget } from '../../api/functions';
import { CreateBudgetDialogDataService } from '../../../app/shared/dialogs/create-budget-dialog/create-budget-dialog.data-service';
import { CreatedBudget } from '../../../app/shared/dialogs/create-budget-dialog/create-budget-dialog.component';
import { toDateOnly } from './_mappers';

@Injectable()
export class HttpCreateBudgetDialogDataService extends CreateBudgetDialogDataService {
  private readonly api = inject(Api);

  createBudget(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<CreatedBudget> {
    return from(
      this.api.invoke(createBudget, {
        body: {
          displayName: name,
          displayDescription: description,
          periodStart: toDateOnly(startDate),
          periodEnd: toDateOnly(endDate),
        },
      })
    ).pipe(
      map((response) => ({
        id: response.id,
        name: response.displayName,
        description: response.displayDescription,
        periodStart: new Date(response.periodStart),
        periodEnd: new Date(response.periodEnd),
      }))
    );
  }
}
