import { Observable } from 'rxjs';
import { UserGroup } from '../../../shared/models';

export interface UpdateGroupInput {
  name: string;
  description: string;
  /** Organization resource names (e.g. "organizations/{id}") or "*" for all. */
  organizations: string[];
  /** Permission strings in "resource:action" format. */
  permissions: string[];
}

export abstract class GroupEditDataService {
  abstract getGroup(id: string): Observable<UserGroup>;
  abstract updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup>;
}
