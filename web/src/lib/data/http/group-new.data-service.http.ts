import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupNewDataService,
  CreateGroupInput,
} from '../../../app/routes/admin/groups/group-new.data-service';

@Injectable()
export class HttpGroupNewDataService extends GroupNewDataService {
  createGroup(input: CreateGroupInput): Observable<UserGroup> {
    // TODO: No generated API endpoint for user groups.
    return throwError(() => new Error('User groups API is not yet implemented.'));
  }
}
