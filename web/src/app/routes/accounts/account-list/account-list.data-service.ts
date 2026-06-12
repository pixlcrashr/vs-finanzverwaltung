import { Observable } from 'rxjs';
import { Account } from '../../../shared/models';

export abstract class AccountListDataService {
  abstract listAccounts(organizationId: string): Observable<Account[]>;
  abstract createAccount(
    organizationId: string,
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null,
    isContainer: boolean,
  ): Observable<Account>;
  abstract deleteAccount(organizationId: string, accountId: string): Observable<void>;
  abstract archiveAccount(organizationId: string, accountId: string): Observable<void>;
  abstract restoreAccount(organizationId: string, accountId: string): Observable<void>;
}
