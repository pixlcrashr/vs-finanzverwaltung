import { Observable } from 'rxjs';
import { Transaction, Account } from '../../../shared/models';

export abstract class TransactionEditDataService {
  abstract getTransaction(organizationId: string, id: string): Observable<Transaction>;
  abstract updateTransaction(organizationId: string, id: string, description: string): Observable<Transaction>;
  abstract listAvailableAccounts(organizationId: string): Observable<Account[]>;
}
