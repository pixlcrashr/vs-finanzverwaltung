import { Observable } from 'rxjs';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  locale: string;
  theme: string;
  emailNotifications: boolean;
}

export interface UpdateUserProfileSettings {
  locale?: string;
  theme?: string;
  emailNotifications?: boolean;
}

export abstract class UserProfileDataService {
  abstract getUserProfile(): Observable<UserProfile>;
  abstract updateSettings(settings: UpdateUserProfileSettings): Observable<UserProfile>;
}
