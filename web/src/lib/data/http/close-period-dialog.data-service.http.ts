import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ImportSourcePeriodServiceService } from '../../api/services/import-source-period-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { ClosePeriodDialogDataService } from '../../../app/shared/dialogs/close-period-dialog/close-period-dialog.data-service';

@Injectable()
export class HttpClosePeriodDialogDataService extends ClosePeriodDialogDataService {
  private readonly svc = inject(ImportSourcePeriodServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  closePeriod(importSourceId: string, periodId: string): Observable<void> {
    const name1 = `organizations/${this.orgSvc.currentOrganization()!.id}/importSources/${importSourceId}/periods/${periodId}`;
    return this.svc.ImportSourcePeriodServiceCloseImportSourcePeriod({ name1, body: {} }).pipe(map(() => undefined));
  }
}
