import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { User } from '../../../app/shared/models';
import { UserListDataService } from '../../../app/routes/admin/users/user-list.data-service';
import { UserServiceService } from '../../api/services/user-service.service';

@Injectable()
export class HttpUserListDataService extends UserListDataService {
  private readonly userService = inject(UserServiceService);

  getUsers(): Observable<User[]> {
    return this.userService.UserServiceListUsers({ pageSize: 100 }).pipe(
      map((resp) => {
        return (resp.users ?? []).map((u) => ({
          id: u.uid ?? '',
          name: u.display_name ?? '',
          email: u.email ?? '',
          image: null,
          groups: [],
        }));
      }),
    );
  }
}
