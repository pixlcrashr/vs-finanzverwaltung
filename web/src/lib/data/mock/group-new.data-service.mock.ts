import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { UserGroup } from '../../../app/shared/models';
import { GroupNewDataService, CreateGroupInput } from '../../../app/routes/admin/groups/group-new.data-service';

@Injectable()
export class MockGroupNewDataService extends GroupNewDataService {
  createGroup(input: CreateGroupInput): Observable<UserGroup> {
    const now = new Date();
    const id = faker.string.uuid();
    const group: UserGroup = {
      id,
      customId: id,
      name: input.name,
      description: input.description,
      organizations: input.organizations,
      permissions: input.permissions,
      createdAt: now,
      updatedAt: now,
    };
    return of(group).pipe(delay(400));
  }
}
