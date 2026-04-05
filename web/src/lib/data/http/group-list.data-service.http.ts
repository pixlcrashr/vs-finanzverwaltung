import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import { GroupListDataService } from '../../../app/routes/admin/groups/group-list.data-service';

@Injectable()
export class HttpGroupListDataService extends GroupListDataService {
  getGroups(): Observable<UserGroup[]> {
    // TODO: No generated API endpoint for user groups.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }

  deleteGroup(id: string): Observable<void> {
    // TODO: No generated API endpoint for user groups.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }
}
