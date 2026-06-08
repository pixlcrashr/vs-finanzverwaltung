import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ImportSourceServiceService } from '../../api/services/import-source-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
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
  private readonly importSvc = inject(ImportSourceServiceService);
  private readonly accountSvc = inject(AccountServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  getImportSources(): Observable<ImportSourceOption[]> {
    return this.importSvc.ImportSourceServiceListImportSources({ parent: this.parent, pageSize: 100 }).pipe(
      map((resp) =>
        (resp.import_sources ?? []).map((s) => ({
          id: s.uid ?? '',
          name: s.display_name,
        })),
      ),
    );
  }

  getAvailableAccounts(): Observable<AccountOption[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 1000 }).pipe(
      map((resp) =>
        (resp.accounts ?? []).map((a) => ({
          id: a.uid ?? '',
          name: a.display_name ?? a.uid ?? '',
          isArchived: a.is_archived ?? false,
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
