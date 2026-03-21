import { Observable } from 'rxjs';
import { UserGroup } from '../../../shared/models';

export interface CreateGroupInput {
  name: string;
  description: string;
}

export abstract class GroupNewDataService {
  abstract createGroup(input: CreateGroupInput): Observable<UserGroup>;
}
