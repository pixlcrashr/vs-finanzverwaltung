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
    public abstract getBudgets(): Observable<Budget[]>;

    public abstract getAccounts(): Observable<Account[]>;

    public abstract getMatrixTargetValues(): Observable<MatrixTargetValues>;

    public abstract getMatrixActualValues(): Observable<MatrixActualValues>;

    public abstract getMatrixEditableValues(): Observable<MatrixEditableValuesByBudget[]>;

    public abstract updateMatrixBudgetValues(updates: MatrixBudgetValueUpdate[]): Observable<void>;
}

export abstract class MatrixTargetValuesService {
    
}
