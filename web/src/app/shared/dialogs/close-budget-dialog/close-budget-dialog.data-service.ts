import { Observable } from 'rxjs';

export abstract class CloseBudgetDialogDataService {
  abstract closeBudget(budgetId: string): Observable<void>;
}
