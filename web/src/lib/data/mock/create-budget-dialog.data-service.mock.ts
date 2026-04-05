import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { CreateBudgetDialogDataService } from '../../../app/shared/dialogs/create-budget-dialog/create-budget-dialog.data-service';
import { CreatedBudget } from '../../../app/shared/dialogs/create-budget-dialog/create-budget-dialog.component';

@Injectable()
export class MockCreateBudgetDialogDataService extends CreateBudgetDialogDataService {
  createBudget(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<CreatedBudget> {
    return of({
      id: faker.string.uuid(),
      name,
      description,
      periodStart: startDate,
      periodEnd: endDate,
    }).pipe(delay(500));
  }
}
