import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupEditDataService,
  UpdateGroupInput,
} from '../../../app/routes/admin/groups/group-edit.data-service';
import { Permissions } from '../../authz/permissions';

@Injectable()
export class MockGroupEditDataService extends GroupEditDataService {
  private group: UserGroup = {
    id: 'g1',
    customId: 'g1',
    name: 'Administratoren',
    description: 'Voller Zugriff auf alle Funktionen',
    isSystem: false,
    organizations: ['*'],
    permissions: [Permissions.USERS_READ, Permissions.USERS_UPDATE, Permissions.JOURNAL_READ],
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-03-20T14:45:00'),
  };

  getGroup(id: string): Observable<UserGroup> {
    return of({ ...this.group, id, customId: id }).pipe(delay(300));
  }

  updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup> {
    this.group = {
      ...this.group,
      id,
      customId: id,
      name: input.name,
      description: input.description,
      organizations: input.organizations,
      permissions: input.permissions,
      updatedAt: new Date(),
    };
    return of({ ...this.group }).pipe(delay(400));
  }
}
