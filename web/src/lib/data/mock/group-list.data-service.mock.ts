import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import { GroupListDataService } from '../../../app/routes/admin/groups/group-list.data-service';

@Injectable()
export class MockGroupListDataService extends GroupListDataService {
  private groups: UserGroup[] = [
    { id: 'g-sys', customId: 'g-sys', name: 'System', description: 'Systemgruppe mit automatischen Zuweisungen', isSystem: true, organizations: ['*'], permissions: [], createdAt: new Date('2024-01-01'), updatedAt: new Date('2024-01-01') },
    { id: 'g1', customId: 'g1', name: 'Administratoren', description: 'Voller Zugriff auf alle Funktionen', organizations: ['*'], permissions: [], createdAt: new Date('2024-01-15'), updatedAt: new Date('2024-03-20') },
    { id: 'g2', customId: 'g2', name: 'Finanzvorstand', description: 'Kann Haushalte und Buchungen verwalten', organizations: ['*'], permissions: [], createdAt: new Date('2024-02-10'), updatedAt: new Date('2024-03-15') },
    { id: 'g3', customId: 'g3', name: 'Kassenprüfer', description: 'Nur Lesezugriff für Prüfungen', organizations: ['*'], permissions: [], createdAt: new Date('2024-01-20'), updatedAt: new Date('2024-02-28') },
    { id: 'g4', customId: 'g4', name: 'Referatsleitung', description: 'Zugriff auf Referatsbudgets', organizations: ['*'], permissions: [], createdAt: new Date('2024-03-01'), updatedAt: new Date('2024-03-25') },
    { id: 'g5', customId: 'g5', name: 'Mitglieder', description: 'Basiszugriff für Mitglieder', organizations: ['*'], permissions: [], createdAt: new Date('2024-01-10'), updatedAt: new Date('2024-02-15') },
  ];

  getGroups(): Observable<UserGroup[]> {
    return of([...this.groups]).pipe(delay(300));
  }

  deleteGroup(id: string): Observable<void> {
    this.groups = this.groups.filter((g) => g.id !== id);
    return of(undefined).pipe(delay(300));
  }
}
