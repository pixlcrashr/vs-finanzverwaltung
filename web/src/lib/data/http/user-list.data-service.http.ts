import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { User } from '../../../app/shared/models';
import { UserListDataService } from '../../../app/routes/admin/users/user-list.data-service';

@Injectable()
export class HttpUserListDataService extends UserListDataService {
  getUsers(): Observable<User[]> {
    // TODO: No generated API endpoint for users.
    return throwError(() => new Error('User API is not yet implemented.'));
  }
}
