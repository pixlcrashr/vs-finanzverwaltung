import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import {
  GroupEditDataService,
  UpdateGroupInput,
  PermissionCategory,
} from '../../../app/routes/admin/groups/group-edit.data-service';

@Injectable()
export class MockGroupEditDataService extends GroupEditDataService {
  private group: UserGroup = {
    id: 'g1',
    name: 'Administratoren',
    description: 'Voller Zugriff auf alle Funktionen',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-03-20T14:45:00'),
  };

  private assignedPermissions: string[] = ['users.view', 'users.edit', 'journal.view'];

  getGroup(id: string): Observable<UserGroup> {
    return of({ ...this.group, id }).pipe(delay(300));
  }

  updateGroup(id: string, input: UpdateGroupInput): Observable<UserGroup> {
    this.group = {
      ...this.group,
      id,
      name: input.name,
      description: input.description,
      updatedAt: new Date(),
    };
    return of({ ...this.group }).pipe(delay(400));
  }

  getPermissions(): Observable<PermissionCategory[]> {
    return of([
      {
        name: 'Benutzerverwaltung',
        permissions: [
          { id: 'users.view', name: 'Benutzer anzeigen', description: 'Benutzer und deren Details einsehen' },
          { id: 'users.edit', name: 'Benutzer bearbeiten', description: 'Benutzer erstellen, ändern und löschen' },
          { id: 'users.groups', name: 'Gruppen verwalten', description: 'Benutzergruppen und Zuweisungen verwalten' },
        ],
      },
      {
        name: 'Journal',
        permissions: [
          { id: 'journal.view', name: 'Journal anzeigen', description: 'Journaleinträge einsehen' },
          { id: 'journal.import', name: 'Journal importieren', description: 'Buchungen aus externen Quellen importieren' },
          { id: 'journal.edit', name: 'Journal bearbeiten', description: 'Journaleinträge erstellen und ändern' },
        ],
      },
      {
        name: 'Haushaltskonten',
        permissions: [
          { id: 'accounts.view', name: 'Konten anzeigen', description: 'Haushaltskonten einsehen' },
          { id: 'accounts.edit', name: 'Konten bearbeiten', description: 'Haushaltskonten erstellen und ändern' },
        ],
      },
      {
        name: 'Anträge',
        permissions: [
          { id: 'applications.view', name: 'Anträge anzeigen', description: 'Anträge und deren Status einsehen' },
          { id: 'applications.edit', name: 'Anträge bearbeiten', description: 'Anträge erstellen und bearbeiten' },
          { id: 'applications.decide', name: 'Anträge entscheiden', description: 'Anträge genehmigen oder ablehnen' },
        ],
      },
    ]).pipe(delay(200));
  }

  getGroupPermissions(groupId: string): Observable<string[]> {
    return of([...this.assignedPermissions]).pipe(delay(200));
  }

  addPermission(groupId: string, permissionId: string): Observable<void> {
    if (!this.assignedPermissions.includes(permissionId)) {
      this.assignedPermissions.push(permissionId);
    }
    return of(undefined).pipe(delay(300));
  }

  removePermission(groupId: string, permissionId: string): Observable<void> {
    this.assignedPermissions = this.assignedPermissions.filter(id => id !== permissionId);
    return of(undefined).pipe(delay(300));
  }
}
