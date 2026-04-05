import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  getImportSource,
  updateImportSource,
  listImportSourcePeriods,
  closeImportSourcePeriod,
} from '../../api/functions';
import { ImportSource } from '../../../app/shared/models';
import {
  ImportSourceEditDataService,
  UpdateImportSourceInput,
} from '../../../app/routes/admin/import-sources/import-source-edit.data-service';
import { mapApiImportSource, mapApiImportSourcePeriod } from './_mappers';

@Injectable()
export class HttpImportSourceEditDataService extends ImportSourceEditDataService {
  private readonly api = inject(Api);

  getImportSource(id: string): Observable<ImportSource> {
    return from(
      Promise.all([
        this.api.invoke(getImportSource, { importSourceId: id }),
        this.api.invoke(listImportSourcePeriods, { importSourceId: id, pageSize: 100 }),
      ]),
    ).pipe(
      map(([source, periodsResp]) => {
        const periods = (periodsResp.periods ?? []).map(mapApiImportSourcePeriod);
        return mapApiImportSource(source, periods);
      }),
    );
  }

  updateImportSource(id: string, input: UpdateImportSourceInput): Observable<ImportSource> {
    return from(
      this.api.invoke(updateImportSource, {
        importSourceId: id,
        body: {
          displayName: input.name,
          displayDescription: input.description,
        },
      }),
    ).pipe(
      map((source) => mapApiImportSource(source, [])),
    );
  }

  closePeriod(sourceId: string, periodId: string): Observable<void> {
    return from(
      this.api.invoke(closeImportSourcePeriod, {
        importSourceId: sourceId,
        periodId,
      }),
    ).pipe(map(() => undefined));
  }
}
