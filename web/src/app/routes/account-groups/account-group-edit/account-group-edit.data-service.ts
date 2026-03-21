import { Observable } from 'rxjs';
import { AccountGroup, AccountGroupAssignment, Account } from '../../../shared/models';

export interface AccountGroupDetails extends AccountGroup {
  assignments: AccountGroupAssignment[];
}

export abstract class AccountGroupEditDataService {
  abstract getGroup(id: string): Observable<AccountGroupDetails>;
  abstract updateGroup(id: string, name: string, description: string): Observable<AccountGroupDetails>;
  abstract getAvailableAccounts(): Observable<Account[]>;
  abstract addAssignment(groupId: string, accountId: string): Observable<void>;
  abstract removeAssignment(groupId: string, assignmentId: string): Observable<void>;
}
