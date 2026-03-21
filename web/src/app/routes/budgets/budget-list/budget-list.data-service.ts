import { Observable } from 'rxjs';
import { Budget } from '../../../shared/models';

export abstract class BudgetListDataService {
  abstract getBudgets(): Observable<Budget[]>;
  abstract createBudget(
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<Budget>;
  abstract deleteBudget(id: string): Observable<void>;
}
