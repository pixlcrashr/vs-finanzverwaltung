import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Setting } from '../../../app/shared/models';
import { SettingsDataService } from '../../../app/routes/admin/settings/settings.data-service';

@Injectable()
export class MockSettingsDataService extends SettingsDataService {
  private settings: Setting[] = [
    {
      key: 'organization_name',
      value: 'Studierendenschaft Beispiel-Universität',
      description: 'Name der Organisation',
    },
  ];

  getSettings(): Observable<Setting[]> {
    return of([...this.settings]).pipe(delay(300));
  }

  updateSetting(key: string, value: string): Observable<Setting> {
    const setting = this.settings.find((s) => s.key === key);
    if (setting) {
      setting.value = value;
    }
    return of(setting!).pipe(delay(300));
  }
}
