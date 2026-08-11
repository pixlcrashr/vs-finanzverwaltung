import { Observable } from 'rxjs';
import { UserGroup } from '../../../shared/models';

export interface CreateGroupInput {
  name: string;
  description: string;
  /** Organization resource names (e.g. "organizations/{id}") or "*" for all. */
  organizations: string[];
  /** Permission strings in "resource:action" format. */
  permissions: string[];
}

export abstract class GroupNewDataService {
  abstract createGroup(input: CreateGroupInput): Observable<UserGroup>;
}
