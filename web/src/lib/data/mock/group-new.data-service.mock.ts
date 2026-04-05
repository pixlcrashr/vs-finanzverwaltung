import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { UserGroup } from '../../../app/shared/models';
import { GroupNewDataService, CreateGroupInput } from '../../../app/routes/admin/groups/group-new.data-service';

@Injectable()
export class MockGroupNewDataService extends GroupNewDataService {
  createGroup(input: CreateGroupInput): Observable<UserGroup> {
    const now = new Date();
    const group: UserGroup = {
      id: faker.string.uuid(),
      name: input.name,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };
    return of(group).pipe(delay(400));
  }
}
