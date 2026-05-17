import { Observable } from 'rxjs';
import { AccountGroup, AccountGroupAssignment, AccountGroupOperation, Account } from '../../../shared/models';

export interface AccountWithOperation {
  account: Account;
  assignment: AccountGroupAssignment | null;
}

export interface AccountGroupDetails extends AccountGroup {
  assignments: AccountGroupAssignment[];
}

export abstract class AccountGroupEditDataService {
  abstract getGroup(id: string): Observable<AccountGroupDetails>;
  abstract updateGroup(id: string, name: string, description: string): Observable<AccountGroupDetails>;
  abstract getAllAccountsWithOperations(groupId: string): Observable<AccountWithOperation[]>;
  abstract updateAccountOperation(groupId: string, accountId: string, operation: AccountGroupOperation): Observable<void>;
  abstract deleteGroup(id: string): Observable<void>;
}
