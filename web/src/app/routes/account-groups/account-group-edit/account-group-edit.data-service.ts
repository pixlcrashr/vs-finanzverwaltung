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
  abstract getGroup(organizationId: string, id: string): Observable<AccountGroupDetails>;
  abstract updateGroup(organizationId: string, id: string, name: string, description: string): Observable<AccountGroupDetails>;
  abstract getAllAccountsWithOperations(organizationId: string, accountGroupId: string): Observable<AccountWithOperation[]>;
  abstract updateAccountOperation(organizationId: string, accountGroupId: string, accountId: string, operation: AccountGroupOperation): Observable<void>;
  abstract deleteGroup(organizationId: string, id: string): Observable<void>;
}
