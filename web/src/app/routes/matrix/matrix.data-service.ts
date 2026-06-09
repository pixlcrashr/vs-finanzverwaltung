import { Observable } from 'rxjs';
import { Account, Budget } from './matrix-data-provider.service';
import { Decimal } from 'decimal.js';



export interface MatrixTargetValues {
  [budgetTagId: string]: {
    [accountId: string]: {
      targetValue: Decimal;
    };
  };
}

export interface MatrixActualValues {
  [budgetId: string]: {
    [accountId: string]: {
      actualValue: Decimal;
    };
  };
}

export interface MatrixEditableValuesByBudget {
  budgetId: string;
  editableValues: {
    [accountId: string]: Decimal;
  };
}

export interface MatrixBudgetValueUpdate {
  budgetId: string;
  accountId: string;
  value: Decimal;
}

export abstract class MatrixDataService {
    public abstract listBudgets(organizationId: string): Observable<Budget[]>;

    public abstract listAccounts(organizationId: string): Observable<Account[]>;

    public abstract listMatrixTargetValues(organizationId: string): Observable<MatrixTargetValues>;

    public abstract listMatrixActualValues(organizationId: string): Observable<MatrixActualValues>;

    public abstract listMatrixEditableValues(organizationId: string): Observable<MatrixEditableValuesByBudget[]>;

    public abstract updateMatrixBudgetValues(organizationId: string, updates: MatrixBudgetValueUpdate[]): Observable<void>;
}

export abstract class MatrixTargetValuesService {

}
