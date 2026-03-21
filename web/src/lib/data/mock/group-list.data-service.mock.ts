import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { UserGroup } from '../../../app/shared/models';
import { GroupListDataService } from '../../../app/routes/admin/groups/group-list.data-service';

@Injectable()
export class MockGroupListDataService extends GroupListDataService {
  private groups: UserGroup[] = [
    { id: 'g1', name: 'Administratoren', description: 'Voller Zugriff auf alle Funktionen' },
    { id: 'g2', name: 'Finanzvorstand', description: 'Kann Haushalte und Buchungen verwalten' },
    { id: 'g3', name: 'Kassenprüfer', description: 'Nur Lesezugriff für Prüfungen' },
    { id: 'g4', name: 'Referatsleitung', description: 'Zugriff auf Referatsbudgets' },
    { id: 'g5', name: 'Mitglieder', description: 'Basiszugriff für Mitglieder' },
  ];

  getGroups(): Observable<UserGroup[]> {
    return of([...this.groups]).pipe(delay(300));
  }

  deleteGroup(id: string): Observable<void> {
    this.groups = this.groups.filter((g) => g.id !== id);
    return of(undefined).pipe(delay(300));
  }
}
