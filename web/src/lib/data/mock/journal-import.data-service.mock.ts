import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import {
  JournalImportDataService,
  ImportSourceOption,
  ImportTransaction,
  ImportSingleTransactionRequest,
  AccountOption,
  UploadResult,
  JournalImportType,
} from '../../../app/routes/journal/journal-import/journal-import.data-service';

@Injectable()
export class MockJournalImportDataService extends JournalImportDataService {
  getImportSources(organizationId: string): Observable<ImportSourceOption[]> {
    return of([
      { id: faker.string.uuid(), name: 'Sparkasse' },
      { id: faker.string.uuid(), name: 'Volksbank' },
      { id: faker.string.uuid(), name: 'Deutsche Bank' },
      { id: faker.string.uuid(), name: 'Commerzbank' },
    ]).pipe(delay(200));
  }

  getAvailableAccounts(organizationId: string): Observable<AccountOption[]> {
    return of([
      { id: faker.string.uuid(), name: '1-01 | Mitgliedsbeiträge', isArchived: false },
      { id: faker.string.uuid(), name: '1-02 | Spenden', isArchived: false },
      { id: faker.string.uuid(), name: '2-01 | Veranstaltungen', isArchived: false },
      { id: faker.string.uuid(), name: '2-02 | Material', isArchived: false },
      { id: faker.string.uuid(), name: '3-01 | Verwaltung', isArchived: false },
      { id: faker.string.uuid(), name: '3-02 | Reisekosten', isArchived: true },
    ]).pipe(delay(200));
  }

  uploadFile(organizationId: string, sourceId: string, type: JournalImportType, file: File): Observable<UploadResult> {
    const count = type === 'lexware'
      ? faker.number.int({ min: 5, max: 15 })
      : faker.number.int({ min: 3, max: 10 });

    const transactions: ImportTransaction[] = Array.from({ length: count }, () => ({
      customId: faker.string.uuid(),
      receiptFrom: faker.date.recent({ days: 90 }).toISOString().slice(0, 10),
      bookedAt: faker.date.recent({ days: 90 }).toISOString().slice(0, 10),
      reference: `${faker.string.alpha({ length: 2, casing: 'upper' })}${faker.number.int({ min: 100, max: 999 })}`,
      description: faker.finance.transactionDescription(),
      amount: faker.finance.amount({ min: 10, max: 5000, dec: 2 }),
      debitAccount: faker.number.int({ min: 1000, max: 9999 }).toString(),
      debitAccountName: faker.finance.accountName(),
      creditAccount: faker.number.int({ min: 1000, max: 9999 }).toString(),
      creditAccountName: faker.finance.accountName(),
    }));

    return of({
      success: true,
      transactions,
      sourceId,
      closedYearsCount: 0,
    }).pipe(delay(1000));
  }

  importTransaction(organizationId: string, request: ImportSingleTransactionRequest): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(500));
  }
}
