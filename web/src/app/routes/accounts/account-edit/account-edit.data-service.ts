import { Observable } from 'rxjs';
import { Account } from '../../../shared/models';

export interface AccountDetails extends Account {
  createdAt: Date;
  updatedAt: Date;
}

export abstract class AccountEditDataService {
  abstract getAccount(id: string): Observable<AccountDetails>;
  abstract updateAccount(
    id: string,
    name: string,
    code: string,
    description: string
  ): Observable<AccountDetails>;
  abstract getParentAccounts(): Observable<Account[]>;
}
