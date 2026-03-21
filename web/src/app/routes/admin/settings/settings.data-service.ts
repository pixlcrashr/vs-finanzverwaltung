import { Observable } from 'rxjs';
import { Setting } from '../../../shared/models';

export abstract class SettingsDataService {
  abstract getSettings(): Observable<Setting[]>;
  abstract updateSetting(key: string, value: string): Observable<Setting>;
}
