import { Observable } from 'rxjs';
import { AccountGroup } from '../../../shared/models';

export abstract class AccountGroupListDataService {
  abstract getGroups(): Observable<AccountGroup[]>;
  abstract createGroup(name: string, description: string): Observable<AccountGroup>;
  abstract deleteGroup(id: string): Observable<void>;
}
