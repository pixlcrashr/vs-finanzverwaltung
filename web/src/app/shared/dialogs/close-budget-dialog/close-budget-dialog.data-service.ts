import { Observable } from 'rxjs';

export abstract class CloseBudgetDialogDataService {
  abstract closeBudget(organizationId: string, budgetId: string): Observable<void>;
}
