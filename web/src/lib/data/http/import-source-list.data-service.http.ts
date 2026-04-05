import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listImportSources,
  listImportSourcePeriods,
} from '../../api/functions';
import { ImportSource } from '../../../app/shared/models';
import { ImportSourceListDataService } from '../../../app/routes/admin/import-sources/import-source-list.data-service';
import { mapApiImportSource, mapApiImportSourcePeriod } from './_mappers';

@Injectable()
export class HttpImportSourceListDataService extends ImportSourceListDataService {
  private readonly api = inject(Api);

  getImportSources(): Observable<ImportSource[]> {
    return from(
      this.api.invoke(listImportSources, { pageSize: 100 }),
    ).pipe(
      map((resp) => {
        const sources = resp.importSources ?? [];
        return sources.map((s) => mapApiImportSource(s, []));
      }),
    );
  }
}
