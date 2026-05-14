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

export abstract class MatrixDataService {
    public abstract getBudgets(): Observable<Budget[]>;

    public abstract getAccounts(): Observable<Account[]>;

    public abstract getMatrixTargetValues(): Observable<MatrixTargetValues>;

    public abstract getMatrixActualValues(): Observable<MatrixActualValues>;
}

export abstract class MatrixTargetValuesService {
    
}
