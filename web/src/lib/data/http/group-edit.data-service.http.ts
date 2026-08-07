import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupEditDataService,
  UpdateGroupInput,
} from '../../../app/routes/admin/groups/group-edit.data-service';
import { GroupServiceService } from '../../api/services/group-service.service';
import { mapV1Group } from './group-mapper';

@Injectable()
export class HttpGroupEditDataService extends GroupEditDataService {
  private readonly groupService = inject(GroupServiceService);

  getGroup(id: string): Observable<UserGroup> {
    return this.groupService.GroupServiceGetGroup(`groups/${id}`).pipe(map(mapV1Group));
  }

  updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup> {
    return this.groupService.GroupServiceUpdateGroup({
      groupName: `groups/${id}`,
      group: {
        display_name: input.name,
        display_description: input.description,
        organizations: input.organizations,
        permissions: input.permissions,
      },
    }).pipe(map(mapV1Group));
  }
}
