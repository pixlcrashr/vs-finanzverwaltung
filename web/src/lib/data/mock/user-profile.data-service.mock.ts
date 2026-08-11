import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  UserProfileDataService,
  UserProfile,
  UpdateUserProfileSettings,
} from '../../../app/routes/profile/user-profile.data-service';

@Injectable()
export class MockUserProfileDataService extends UserProfileDataService {
  private profile: UserProfile = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Mock User',
    email: 'mock@vsfv.local',
    locale: 'de-DE',
    theme: 'system',
    emailNotifications: true,
  };

  getUserProfile(): Observable<UserProfile> {
    return of({ ...this.profile }).pipe(delay(300));
  }

  updateSettings(settings: UpdateUserProfileSettings): Observable<UserProfile> {
    this.profile = {
      ...this.profile,
      ...settings,
    };
    return of({ ...this.profile }).pipe(delay(300));
  }
}
