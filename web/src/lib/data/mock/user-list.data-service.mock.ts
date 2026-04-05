import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { User } from '../../../app/shared/models';
import { UserListDataService } from '../../../app/routes/admin/users/user-list.data-service';

@Injectable()
export class MockUserListDataService extends UserListDataService {
  private users: User[] = this.generateUsers();

  getUsers(): Observable<User[]> {
    return of([...this.users]).pipe(delay(300));
  }

  private generateUsers(): User[] {
    const groups = [
      { id: 'g1', name: 'Administratoren', description: 'Voller Zugriff', createdAt: faker.date.past({ years: 2 }), updatedAt: faker.date.recent() },
      { id: 'g2', name: 'Finanzvorstand', description: 'Finanzverwaltung', createdAt: faker.date.past({ years: 2 }), updatedAt: faker.date.recent() },
      { id: 'g3', name: 'Kassenprüfer', description: 'Nur Lesezugriff', createdAt: faker.date.past({ years: 2 }), updatedAt: faker.date.recent() },
    ];

    return Array.from({ length: 8 }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      image: Math.random() > 0.5 ? faker.image.avatar() : null,
      groups: groups.filter(() => Math.random() > 0.5),
    }));
  }
}
