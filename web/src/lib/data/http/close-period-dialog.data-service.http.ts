import { inject, Injectable } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import { closeImportSourcePeriod } from '../../api/functions';
import { ClosePeriodDialogDataService } from '../../../app/shared/dialogs/close-period-dialog/close-period-dialog.data-service';

@Injectable()
export class HttpClosePeriodDialogDataService extends ClosePeriodDialogDataService {
  private readonly api = inject(Api);

  closePeriod(importSourceId: string, periodId: string): Observable<void> {
    return from(
      this.api.invoke(closeImportSourcePeriod, { importSourceId, periodId })
    ).pipe(map(() => undefined));
  }
}
