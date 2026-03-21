import { Observable } from 'rxjs';
import { UserGroup } from '../../../shared/models';

export interface UpdateGroupInput {
  name: string;
  description: string;
}

export abstract class GroupEditDataService {
  abstract getGroup(id: string): Observable<UserGroup>;
  abstract updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup>;
}
