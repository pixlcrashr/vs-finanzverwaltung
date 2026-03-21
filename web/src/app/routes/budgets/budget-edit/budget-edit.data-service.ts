import { Observable } from 'rxjs';
import { Budget, BudgetRevision } from '../../../shared/models';

export interface BudgetDetails extends Budget {
  revisions: BudgetRevision[];
}

export abstract class BudgetEditDataService {
  abstract getBudget(id: string): Observable<BudgetDetails>;
  abstract updateBudget(
    id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date
  ): Observable<void>;
  abstract addRevision(budgetId: string, date: Date, description: string): Observable<BudgetRevision>;
  abstract updateRevision(id: string, date: Date, description: string): Observable<void>;
  abstract deleteRevision(id: string): Observable<void>;
  abstract closeBudget(id: string): Observable<void>;
}
