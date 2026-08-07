import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupNewDataService,
  CreateGroupInput,
} from '../../../app/routes/admin/groups/group-new.data-service';
import { GroupServiceService } from '../../api/services/group-service.service';
import { mapV1Group } from './group-mapper';

@Injectable()
export class HttpGroupNewDataService extends GroupNewDataService {
  private readonly groupService = inject(GroupServiceService);

  createGroup(input: CreateGroupInput): Observable<UserGroup> {
    return this.groupService.GroupServiceCreateGroup({
      group: {
        display_name: input.name,
        display_description: input.description,
        organizations: input.organizations,
        permissions: input.permissions,
      },
    }).pipe(map(mapV1Group));
  }
}
