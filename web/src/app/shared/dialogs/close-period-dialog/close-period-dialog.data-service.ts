import { Observable } from 'rxjs';

export abstract class ClosePeriodDialogDataService {
  abstract closePeriod(importSourceId: string, periodId: string): Observable<void>;
}
