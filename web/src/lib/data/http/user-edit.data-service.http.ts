import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { User, UserGroup } from '../../../app/shared/models';
import { UserEditDataService } from '../../../app/routes/admin/users/user-edit.data-service';

@Injectable()
export class HttpUserEditDataService extends UserEditDataService {
  getUser(id: string): Observable<User> {
    // TODO: No generated API endpoint for users.
    return throwError(() => new Error('User API is not yet implemented.'));
  }

  getAvailableGroups(): Observable<UserGroup[]> {
    // TODO: No generated API endpoint for user groups.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }

  addUserToGroup(userId: string, groupId: string): Observable<void> {
    // TODO: No generated API endpoint for user group membership.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }

  removeUserFromGroup(userId: string, groupId: string): Observable<void> {
    // TODO: No generated API endpoint for user group membership.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }
}
