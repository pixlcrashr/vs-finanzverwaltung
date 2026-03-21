import { Observable } from 'rxjs';
import { User, UserGroup } from '../../../shared/models';

export abstract class UserEditDataService {
  abstract getUser(id: string): Observable<User>;
  abstract getAvailableGroups(): Observable<UserGroup[]>;
  abstract addUserToGroup(userId: string, groupId: string): Observable<void>;
  abstract removeUserFromGroup(userId: string, groupId: string): Observable<void>;
}
