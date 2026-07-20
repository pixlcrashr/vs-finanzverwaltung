import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthorizationService } from './authorization.service';

export interface CurrentUserInfo {
  id: string;
  name: string;
  email: string;
}

export abstract class CurrentUserService {
  abstract getCurrentUser(): Observable<CurrentUserInfo | null>;
}

@Injectable({ providedIn: 'root' })
export class CurrentUserInitializer {
  private readonly currentUserService = inject(CurrentUserService);
  private readonly authorizationService = inject(AuthorizationService);

  initialize(): Observable<CurrentUserInfo | null> {
    return new Observable<CurrentUserInfo | null>((subscriber) => {
      this.currentUserService.getCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            this.authorizationService.currentUser.set(`users/${user.id}`);
          }
          subscriber.next(user);
          subscriber.complete();
        },
        error: () => {
          subscriber.next(null);
          subscriber.complete();
        },
      });
    });
  }
}
