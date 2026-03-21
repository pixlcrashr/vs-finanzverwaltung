import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import {
  JournalImportDataService,
  ImportSourceOption,
  ImportResult,
  JournalImportType,
} from '../../../app/routes/journal/journal-import/journal-import.data-service';

@Injectable()
export class MockJournalImportDataService extends JournalImportDataService {
  getImportSources(): Observable<ImportSourceOption[]> {
    return of([
      { id: faker.string.uuid(), name: 'Sparkasse' },
      { id: faker.string.uuid(), name: 'Volksbank' },
      { id: faker.string.uuid(), name: 'Deutsche Bank' },
      { id: faker.string.uuid(), name: 'Commerzbank' },
    ]).pipe(delay(200));
  }

  importFile(sourceId: string, type: JournalImportType, file: File): Observable<ImportResult> {
    const imported =
      type === 'lexware'
        ? faker.number.int({ min: 20, max: 70 })
        : faker.number.int({ min: 10, max: 40 });
    const skipped = faker.number.int({ min: 0, max: 5 });

    return of({
      success: true,
      importedCount: imported,
      skippedCount: skipped,
      errors: skipped > 0 ? ['Einige Duplikate wurden übersprungen'] : [],
    }).pipe(delay(1500));
  }
}
