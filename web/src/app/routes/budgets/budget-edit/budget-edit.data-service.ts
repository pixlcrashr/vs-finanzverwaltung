import { Observable } from 'rxjs';
import { Decimal } from 'decimal.js';
import { Budget, BudgetTag } from '../../../shared/models';

export interface BudgetChange {
  accountId: string;
  accountFullCode: string;
  accountName: string;
  previousValue: Decimal;
  newValue: Decimal;
  diff: Decimal;
}

export interface BudgetDetails extends Budget {
  tags: BudgetTag[];
  hasUntaggedChanges: boolean;
  changes: BudgetChange[];
}

export abstract class BudgetEditDataService {
  abstract getBudget(id: string): Observable<BudgetDetails>;
  abstract updateBudget(
    id: string,
    name: string,
    description: string,
    startDate: Date,
    endDate: Date,
    publishCurrentTargetValuesAlways: boolean,
    publishCurrentActualValuesAlways: boolean
  ): Observable<void>;
  abstract addTag(budgetId: string, date: Date, name: string, description: string, force: boolean): Observable<BudgetTag>;
  abstract updateTagPublication(id: string, isPublished: boolean): Observable<void>;
  abstract deleteTag(id: string): Observable<void>;
  abstract closeBudget(id: string): Observable<void>;
}
