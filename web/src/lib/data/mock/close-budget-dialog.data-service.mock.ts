import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { CloseBudgetDialogDataService } from '../../../app/shared/dialogs/close-budget-dialog/close-budget-dialog.data-service';

@Injectable()
export class MockCloseBudgetDialogDataService extends CloseBudgetDialogDataService {
  closeBudget(_organizationId: string, _budgetId: string): Observable<void> {
    return of(undefined).pipe(delay(500));
  }
}
