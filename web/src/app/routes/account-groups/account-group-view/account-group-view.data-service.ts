import { Observable } from 'rxjs';
import { AccountGroup, AccountGroupAssignment, AccountGroupStats } from '../../../shared/models';

export abstract class AccountGroupViewDataService {
  abstract getGroup(id: string): Observable<AccountGroupStats>;
}
