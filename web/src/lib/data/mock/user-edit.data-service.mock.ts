import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { User, UserGroup } from '../../../app/shared/models';
import { UserEditDataService } from '../../../app/routes/admin/users/user-edit.data-service';

@Injectable()
export class MockUserEditDataService extends UserEditDataService {
  private user: User = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    image: faker.image.avatar(),
    groups: [
      { id: 'g2', name: 'Finanzvorstand', description: 'Finanzverwaltung' },
    ],
  };

  private availableGroups: UserGroup[] = [
    { id: 'g1', name: 'Administratoren', description: 'Voller Zugriff auf alle Funktionen' },
    { id: 'g2', name: 'Finanzvorstand', description: 'Kann Haushalte und Buchungen verwalten' },
    { id: 'g3', name: 'Kassenprüfer', description: 'Nur Lesezugriff für Prüfungen' },
    { id: 'g4', name: 'Referatsleitung', description: 'Zugriff auf Referatsbudgets' },
  ];

  getUser(id: string): Observable<User> {
    return of({ ...this.user, id }).pipe(delay(300));
  }

  getAvailableGroups(): Observable<UserGroup[]> {
    return of([...this.availableGroups]).pipe(delay(200));
  }

  addUserToGroup(userId: string, groupId: string): Observable<void> {
    const group = this.availableGroups.find((g) => g.id === groupId);
    if (group && !this.user.groups.find((g) => g.id === groupId)) {
      this.user.groups.push(group);
    }
    return of(undefined).pipe(delay(300));
  }

  removeUserFromGroup(userId: string, groupId: string): Observable<void> {
    this.user.groups = this.user.groups.filter((g) => g.id !== groupId);
    return of(undefined).pipe(delay(300));
  }
}
