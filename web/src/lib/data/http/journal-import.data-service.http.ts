import { Injectable, inject } from '@angular/core';
import { Observable, from, map, throwError } from 'rxjs';
import { Api } from '../../api/api';
import { listImportSources } from '../../api/functions';
import {
  JournalImportDataService,
  JournalImportType,
  ImportSourceOption,
  ImportResult,
} from '../../../app/routes/journal/journal-import/journal-import.data-service';

@Injectable()
export class HttpJournalImportDataService extends JournalImportDataService {
  private readonly api = inject(Api);

  getImportSources(): Observable<ImportSourceOption[]> {
    return from(
      this.api.invoke(listImportSources, { pageSize: 100 }),
    ).pipe(
      map((resp) =>
        (resp.importSources ?? []).map((s) => ({
          id: s.id,
          name: s.displayName,
        })),
      ),
    );
  }

  importFile(sourceId: string, type: JournalImportType, file: File): Observable<ImportResult> {
    // TODO: No generated API endpoint for file import. Requires a custom endpoint.
    return throwError(() => new Error('File import is not yet implemented via the HTTP API.'));
  }
}
