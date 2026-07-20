import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { CurrentUserInfo, CurrentUserService } from '../../authz/current-user.service';

@Injectable()
export class HttpCurrentUserService extends CurrentUserService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<CurrentUserInfo | null> {
    return this.http
      .get<CurrentUserInfo>('/auth/me', { withCredentials: true })
      .pipe(
        map((body) => ({
          id: body.id,
          name: body.name,
          email: body.email,
        })),
        catchError(() => of(null)),
      );
  }
}
