import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, switchMap } from 'rxjs';
import { CurrentUserService, CurrentUserInfo } from '../../authz/current-user.service';
import { UserSettingsServiceService } from '../../api/services/user-settings-service.service';
import {
  UserProfileDataService,
  UserProfile,
  UpdateUserProfileSettings,
} from '../../../app/routes/profile/user-profile.data-service';

@Injectable()
export class HttpUserProfileDataService extends UserProfileDataService {
  private readonly currentUserSvc = inject(CurrentUserService);
  private readonly settingsSvc = inject(UserSettingsServiceService);

  getUserProfile(): Observable<UserProfile> {
    return this.currentUserSvc.getCurrentUser().pipe(
      switchMap((user: CurrentUserInfo | null) => {
        if (!user) {
          throw new Error('Not authenticated');
        }
        const settingsName = `users/${user.id}/settings`;
        return this.settingsSvc.UserSettingsServiceGetUserSettings(settingsName).pipe(
          map((settings) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            pictureUrl: user.pictureUrl,
            locale: settings.locale ?? '',
            theme: settings.theme ?? 'system',
            emailNotifications: (settings as any).email_notifications ?? false,
          })),
        );
      }),
    );
  }

  updateSettings(settings: UpdateUserProfileSettings): Observable<UserProfile> {
    return this.currentUserSvc.getCurrentUser().pipe(
      switchMap((user: CurrentUserInfo | null) => {
        if (!user) {
          throw new Error('Not authenticated');
        }
        const settingsName = `users/${user.id}/settings`;
        return this.settingsSvc.UserSettingsServiceUpdateUserSettings({
          settingsName,
          settings: {
            locale: settings.locale,
            theme: settings.theme,
            email_notifications: settings.emailNotifications,
          } as any,
          allowMissing: true,
        }).pipe(
          map((updated) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            pictureUrl: user.pictureUrl,
            locale: updated.locale ?? '',
            theme: updated.theme ?? 'system',
            emailNotifications: (updated as any).email_notifications ?? false,
          })),
        );
      }),
    );
  }
}
