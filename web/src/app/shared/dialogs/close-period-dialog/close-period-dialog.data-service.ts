import { Observable } from 'rxjs';

export abstract class ClosePeriodDialogDataService {
  abstract closePeriod(organizationId: string, importSourceId: string, periodId: string): Observable<void>;
}
