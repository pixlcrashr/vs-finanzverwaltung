import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { AccountServiceService } from '../../api/services/account-service.service';
import {
  JournalImportDataService,
  JournalImportType,
  ImportSingleTransactionRequest,
  AccountOption,
  UploadResult,
  ImportTransaction,
} from '../../../app/routes/journal/journal-import/journal-import.data-service';

@Injectable()
export class HttpJournalImportDataService extends JournalImportDataService {
  private readonly accountSvc = inject(AccountServiceService);

  getAvailableAccounts(organizationId: string): Observable<AccountOption[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: `organizations/${organizationId}`, pageSize: 1000 }).pipe(
      map((resp) =>
        (resp.accounts ?? []).map((a) => ({
          id: a.uid ?? '',
          name: a.display_name ?? a.uid ?? '',
          isArchived: a.is_archived ?? false,
        })),
      ),
    );
  }

  uploadFile(_organizationId: string, type: JournalImportType, file: File): Observable<UploadResult> {
    // TODO: Implement file upload endpoint when available on server
    // For now, mock the response for testing purposes
    const mockTransactions: ImportTransaction[] = [
      {
        customId: '1',
        receiptFrom: '2024-01-15',
        bookedAt: '2024-01-15',
        reference: 'REF001',
        description: type === 'lexware' ? 'Lexware Import' : 'DATEV Import',
        amount: '100.00',
        debitAccount: '1000',
        debitAccountName: 'Bank',
        creditAccount: '7000',
        creditAccountName: 'Einnahmen',
      },
    ];

    return of({
      success: true,
      transactions: mockTransactions,
      closedYearsCount: 0,
    });
  }

  importTransaction(_organizationId: string, _request: ImportSingleTransactionRequest): Observable<{ success: boolean }> {
    // TODO: Implement when server endpoint is available
    // For now, mock success
    return of({ success: true });
  }
}
