import { Observable } from 'rxjs';
import { AccountGroupStats } from '../../../shared/models';

export abstract class AccountGroupStatsDataService {
  abstract getGroup(id: string): Observable<AccountGroupStats>;
}
