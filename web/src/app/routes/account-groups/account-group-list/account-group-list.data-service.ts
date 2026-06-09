import { Observable } from 'rxjs';
import { AccountGroup } from '../../../shared/models';

export abstract class AccountGroupListDataService {
  abstract listGroups(organizationId: string): Observable<AccountGroup[]>;
  abstract createGroup(organizationId: string, name: string, description: string): Observable<AccountGroup>;
  abstract deleteGroup(organizationId: string, accountGroupId: string): Observable<void>;
}
