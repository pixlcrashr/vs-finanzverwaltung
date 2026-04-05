import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ClosePeriodDialogDataService } from '../../../app/shared/dialogs/close-period-dialog/close-period-dialog.data-service';

@Injectable()
export class MockClosePeriodDialogDataService extends ClosePeriodDialogDataService {
  closePeriod(_importSourceId: string, _periodId: string): Observable<void> {
    return of(undefined).pipe(delay(500));
  }
}
