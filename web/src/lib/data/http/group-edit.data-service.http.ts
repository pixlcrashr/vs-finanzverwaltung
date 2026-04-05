import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupEditDataService,
  UpdateGroupInput,
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
}
