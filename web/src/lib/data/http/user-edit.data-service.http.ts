import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { User, UserGroup } from '../../../app/shared/models';
import { UserEditDataService } from '../../../app/routes/admin/users/user-edit.data-service';
import { UserServiceService } from '../../api/services/user-service.service';
import { GroupServiceService } from '../../api/services/group-service.service';
import { mapV1Group } from './group-mapper';

@Injectable()
export class HttpUserEditDataService extends UserEditDataService {
  private readonly userSvc = inject(UserServiceService);
  private readonly groupSvc = inject(GroupServiceService);
  private readonly http = inject(HttpClient);

  private get rootUrl(): string {
    return this.userSvc.rootUrl;
  }

  getUser(id: string): Observable<User> {
    const userName = `users/${id}`;
    return forkJoin({
      user: this.userSvc.UserServiceGetUser(userName),
      groups: this.http.get<any>(
        `${this.rootUrl}/v1/${encodeURIComponent(userName)}:listGroups`,
      ),
    }).pipe(
      map(({ user, groups }) => ({
        id: user.uid ?? id,
        name: user.display_name ?? '',
        email: user.email ?? '',
        image: null,
        groups: (groups as any).groups ?? [],
      })),
      map((result) => ({
        ...result,
        groups: result.groups.map(mapV1Group),
      })),
    );
  }

  getAvailableGroups(): Observable<UserGroup[]> {
    return this.groupSvc.GroupServiceListGroups({ pageSize: 100 }).pipe(
      map((resp) => (resp.groups ?? []).map(mapV1Group)),
    );
  }

  addUserToGroup(userId: string, groupId: string): Observable<void> {
    const groupName = `groups/${groupId}`;
    const userName = `users/${userId}`;
    return this.http.post<void>(
      `${this.rootUrl}/v1/${encodeURIComponent(groupName)}:addUser`,
      { user: userName },
    ).pipe(map(() => void 0));
  }

  removeUserFromGroup(userId: string, groupId: string): Observable<void> {
    const groupName = `groups/${groupId}`;
    const userName = `users/${userId}`;
    return this.http.post<void>(
      `${this.rootUrl}/v1/${encodeURIComponent(groupName)}:removeUser`,
      { user: userName },
    ).pipe(map(() => void 0));
  }
}
