import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ImportSourcePeriodServiceService } from '../../api/services/import-source-period-service.service';
import { ClosePeriodDialogDataService } from '../../../app/shared/dialogs/close-period-dialog/close-period-dialog.data-service';

@Injectable()
export class HttpClosePeriodDialogDataService extends ClosePeriodDialogDataService {
  private readonly svc = inject(ImportSourcePeriodServiceService);

  closePeriod(organizationId: string, importSourceId: string, periodId: string): Observable<void> {
    const name1 = `organizations/${organizationId}/importSources/${importSourceId}/periods/${periodId}`;
    return this.svc.ImportSourcePeriodServiceCloseImportSourcePeriod({ name1, body: {} }).pipe(map(() => undefined));
  }
}
