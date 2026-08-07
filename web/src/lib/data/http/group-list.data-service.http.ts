import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import { GroupListDataService } from '../../../app/routes/admin/groups/group-list.data-service';
import { GroupServiceService } from '../../api/services/group-service.service';
import { mapV1Group } from './group-mapper';

@Injectable()
export class HttpGroupListDataService extends GroupListDataService {
  private readonly groupService = inject(GroupServiceService);

  getGroups(): Observable<UserGroup[]> {
    return this.groupService.GroupServiceListGroups({ pageSize: 100 }).pipe(
      map((resp) => {
        return (resp.groups ?? []).map(mapV1Group);
      }),
    );
  }

  deleteGroup(id: string): Observable<void> {
    return this.groupService.GroupServiceDeleteGroup(`groups/${id}`).pipe(
      map(() => void 0),
    );
  }
}
