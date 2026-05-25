import { Injectable, inject } from '@angular/core';
import { Observable, from, map, throwError } from 'rxjs';
import { Api } from '../../api/api';
import { listImportSources, listAccounts } from '../../api/functions';
import {
  JournalImportDataService,
  JournalImportType,
  ImportSourceOption,
  ImportSingleTransactionRequest,
  AccountOption,
  UploadResult,
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

  getAvailableAccounts(): Observable<AccountOption[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 1000 }),
    ).pipe(
      map((resp) =>
        (resp.accounts ?? []).map((a) => ({
          id: a.id,
          name: a.displayName ?? a.id,
          isArchived: a.isArchived ?? false,
        })),
      ),
    );
  }

  uploadFile(sourceId: string, type: JournalImportType, file: File): Observable<UploadResult> {
    // TODO: Requires a custom endpoint for file upload and parsing.
    return throwError(() => new Error('File upload is not yet implemented via the HTTP API.'));
  }

  importTransaction(request: ImportSingleTransactionRequest): Observable<{ success: boolean }> {
    // TODO: Requires a custom endpoint for importing a single transaction.
    return throwError(() => new Error('Transaction import is not yet implemented via the HTTP API.'));
  }
}
