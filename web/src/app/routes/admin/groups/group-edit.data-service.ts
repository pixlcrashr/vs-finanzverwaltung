import { Observable } from 'rxjs';
import { UserGroup } from '../../../shared/models';

export interface UpdateGroupInput {
  name: string;
  description: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

export abstract class GroupEditDataService {
  abstract getGroup(id: string): Observable<UserGroup>;
  abstract updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup>;
  abstract getPermissions(): Observable<PermissionCategory[]>;
  abstract getGroupPermissions(groupId: string): Observable<string[]>;
  abstract addPermission(groupId: string, permissionId: string): Observable<void>;
  abstract removePermission(groupId: string, permissionId: string): Observable<void>;
}
