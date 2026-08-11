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

export interface UpdateBudgetParams {
  name: string;
  description: string;
  isPublished: boolean;
  publishActualValues: boolean;
  publishActualValuesUntil?: Date | null;
}

export abstract class BudgetEditDataService {
  abstract getBudget(organizationId: string, budgetId: string): Observable<BudgetDetails>;
  abstract updateBudget(
    organizationId: string,
    budgetId: string,
    params: UpdateBudgetParams,
  ): Observable<void>;
  abstract createBudgetRevision(organizationId: string, budgetId: string, date: Date, name: string, description: string, force: boolean): Observable<BudgetTag>;
  abstract updateBudgetRevision(organizationId: string, budgetId: string, budgetRevisionId: string, isPublished: boolean): Observable<void>;
  abstract deleteBudgetRevision(organizationId: string, budgetRevisionId: string): Observable<void>;
  abstract closeBudget(organizationId: string, budgetId: string): Observable<void>;
}
