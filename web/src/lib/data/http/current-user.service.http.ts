import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { OAuthService } from 'angular-oauth2-oidc';
import { CurrentUserInfo, CurrentUserService } from '../../authz/current-user.service';

@Injectable()
export class HttpCurrentUserService extends CurrentUserService {
  private readonly http = inject(HttpClient);
  private readonly oauthService = inject(OAuthService);

  getCurrentUser(): Observable<CurrentUserInfo | null> {
    const claims = this.oauthService.getIdentityClaims() as Record<string, string> | null;
    if (claims && claims['sub']) {
      return of({
        id: claims['sub'],
        name: claims['name'] || '',
        email: claims['email'] || '',
        pictureUrl: claims['picture'] || claims['picture_url'] || undefined,
      });
    }

    // Fallback: fetch from /auth/me with Bearer token
    return this.http
      .get<CurrentUserInfo>('/auth/me')
      .pipe(
        map((body) => ({
          id: body.id,
          name: body.name,
          email: body.email,
          pictureUrl: body.pictureUrl || body.pictureUrl,
        })),
        catchError(() => of(null)),
      );
  }
}
