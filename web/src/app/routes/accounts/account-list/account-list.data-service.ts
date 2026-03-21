import { Observable } from 'rxjs';
import { Account } from '../../../shared/models';

export abstract class AccountListDataService {
  abstract getAccounts(): Observable<Account[]>;
  abstract createAccount(
    name: string,
    code: string,
    description: string,
    parentAccountId: string | null
  ): Observable<Account>;
  abstract deleteAccount(id: string): Observable<void>;
  abstract archiveAccount(id: string): Observable<void>;
  abstract restoreAccount(id: string): Observable<void>;
}
