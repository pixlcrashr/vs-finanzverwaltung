import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CurrentUserInfo, CurrentUserService } from '../../authz/current-user.service';

@Injectable()
export class MockCurrentUserService extends CurrentUserService {
  private readonly mockUser: CurrentUserInfo = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Mock User',
    email: 'mock@vsfv.local',
    pictureUrl: undefined,
  };

  getCurrentUser(): Observable<CurrentUserInfo | null> {
    return of(this.mockUser);
  }
}
