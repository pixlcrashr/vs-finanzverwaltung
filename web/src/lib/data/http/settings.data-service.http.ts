import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Setting } from '../../../app/shared/models';
import { SettingsDataService } from '../../../app/routes/admin/settings/settings.data-service';

@Injectable()
export class HttpSettingsDataService extends SettingsDataService {
  getSettings(): Observable<Setting[]> {
    // TODO: No generated API endpoint for settings.
    return throwError(() => new Error('Settings API is not yet implemented.'));
  }

  updateSetting(key: string, value: string): Observable<Setting> {
    // TODO: No generated API endpoint for settings.
    return throwError(() => new Error('Settings API is not yet implemented.'));
  }
}
