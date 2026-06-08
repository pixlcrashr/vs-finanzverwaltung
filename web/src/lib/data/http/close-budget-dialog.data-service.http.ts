import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BudgetServiceService } from '../../api/services/budget-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { CloseBudgetDialogDataService } from '../../../app/shared/dialogs/close-budget-dialog/close-budget-dialog.data-service';

@Injectable()
export class HttpCloseBudgetDialogDataService extends CloseBudgetDialogDataService {
  private readonly svc = inject(BudgetServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  closeBudget(budgetId: string): Observable<void> {
    const name = `organizations/${this.orgSvc.currentOrganization()!.id}/budgets/${budgetId}`;
    return this.svc.BudgetServiceCloseBudget({ name, body: {} }).pipe(map(() => undefined));
  }
}
