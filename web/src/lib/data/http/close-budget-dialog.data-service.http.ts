import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { CloseBudgetDialogDataService } from '../../../app/shared/dialogs/close-budget-dialog/close-budget-dialog.data-service';

@Injectable()
export class HttpCloseBudgetDialogDataService extends CloseBudgetDialogDataService {
  private readonly svc = inject(BudgetServiceService);

  closeBudget(organizationId: string, budgetId: string): Observable<void> {
    const name = `organizations/${organizationId}/budgets/${budgetId}`;
    return this.svc.BudgetServiceCloseBudget({ name, body: {} }).pipe(map(() => undefined));
  }
}
