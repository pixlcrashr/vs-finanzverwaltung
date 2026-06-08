import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ImportSourceServiceService } from '../../api/services/import-source-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { ImportSource } from '../../../app/shared/models';
import { ImportSourceListDataService } from '../../../app/routes/admin/import-sources/import-source-list.data-service';
import { mapApiImportSource } from './_mappers';

@Injectable()
export class HttpImportSourceListDataService extends ImportSourceListDataService {
  private readonly svc = inject(ImportSourceServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  getImportSources(): Observable<ImportSource[]> {
    return this.svc.ImportSourceServiceListImportSources({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) => (resp.import_sources ?? []).map((s) => mapApiImportSource(s, []))),
    );
  }
}
