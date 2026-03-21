import { Observable } from 'rxjs';
import { Transaction, TransactionAccountAssignment, Account } from '../../../shared/models';

export abstract class TransactionEditDataService {
  abstract getTransaction(id: string): Observable<Transaction>;
  abstract updateTransaction(id: string, description: string): Observable<Transaction>;
  abstract getAvailableAccounts(): Observable<Account[]>;
  abstract addAssignment(transactionId: string, accountId: string, value: string): Observable<void>;
  abstract removeAssignment(transactionId: string, assignmentId: string): Observable<void>;
}
