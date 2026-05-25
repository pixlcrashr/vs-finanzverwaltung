import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupEditDataService,
  UpdateGroupInput,
  PermissionCategory,
} from '../../../app/routes/admin/groups/group-edit.data-service';

@Injectable()
export class HttpGroupEditDataService extends GroupEditDataService {
  getGroup(id: string): Observable<UserGroup> {
    // TODO: No generated API endpoint for user groups.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }

  updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup> {
    // TODO: No generated API endpoint for user groups.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }

  getPermissions(): Observable<PermissionCategory[]> {
    // TODO: No generated API endpoint for permissions.
    return throwError(() => new Error('Permissions API is not yet implemented.'));
  }

  getGroupPermissions(groupId: string): Observable<string[]> {
    // TODO: No generated API endpoint for group permissions.
    return throwError(() => new Error('Group permissions API is not yet implemented.'));
  }

  addPermission(groupId: string, permissionId: string): Observable<void> {
    // TODO: No generated API endpoint for group permissions.
    return throwError(() => new Error('Group permissions API is not yet implemented.'));
  }

  removePermission(groupId: string, permissionId: string): Observable<void> {
    // TODO: No generated API endpoint for group permissions.
    return throwError(() => new Error('Group permissions API is not yet implemented.'));
  }
}
