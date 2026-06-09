import { Observable } from 'rxjs';
import { CreatedBudget } from './create-budget-dialog.component';

export abstract class CreateBudgetDialogDataService {
  abstract createBudget(
    organizationId: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<CreatedBudget>;
}
