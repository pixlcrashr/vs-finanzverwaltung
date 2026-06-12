import { Observable } from 'rxjs';
import { Account } from '../../../shared/models';

export interface AccountDetails extends Account {
  createdAt: Date;
  updatedAt: Date;
}

export abstract class AccountEditDataService {
  abstract getAccount(organizationId: string, accountId: string): Observable<AccountDetails>;
  abstract updateAccount(
    organizationId: string,
    accountId: string,
    name: string,
    code: string,
    description: string
  ): Observable<AccountDetails>;
  abstract listParentAccounts(organizationId: string): Observable<Account[]>;
  abstract deleteAccount(organizationId: string, accountId: string): Observable<void>;
}
