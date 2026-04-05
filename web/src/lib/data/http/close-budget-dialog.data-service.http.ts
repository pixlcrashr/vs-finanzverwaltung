import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { closeBudget } from '../../api/functions';
import { CloseBudgetDialogDataService } from '../../../app/shared/dialogs/close-budget-dialog/close-budget-dialog.data-service';

@Injectable()
export class HttpCloseBudgetDialogDataService extends CloseBudgetDialogDataService {
  private readonly api = inject(Api);

  closeBudget(budgetId: string): Observable<void> {
    return from(
      this.api.invoke(closeBudget, { budgetId })
    ).pipe(map(() => undefined));
  }
}
