import { Observable } from 'rxjs';
import { UserGroup } from '../../../shared/models';

export abstract class GroupListDataService {
  abstract getGroups(): Observable<UserGroup[]>;
  abstract deleteGroup(id: string): Observable<void>;
}
