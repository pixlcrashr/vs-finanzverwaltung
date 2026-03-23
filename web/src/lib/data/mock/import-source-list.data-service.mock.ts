import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { ImportSource } from '../../../app/shared/models';
import { ImportSourceListDataService } from '../../../app/routes/admin/import-sources/import-source-list.data-service';

@Injectable()
export class MockImportSourceListDataService extends ImportSourceListDataService {
  private importSources: ImportSource[] = [
    {
      id: faker.string.uuid(),
      name: 'Bank CSV Export',
      description: 'Monthly bank statement exports in CSV format',
      periodStart: new Date(2020, 0, 1),
      periods: [
        { id: 'p1', year: 2024, isClosed: true, closedAt: new Date(2025, 0, 15) },
        { id: 'p2', year: 2025, isClosed: true, closedAt: new Date(2026, 0, 10) },
        { id: 'p3', year: 2026, isClosed: false, closedAt: null },
      ],
    },
    {
      id: faker.string.uuid(),
      name: 'SAP Finance Interface',
      description: 'Automated import from SAP financial module',
      periodStart: new Date(2022, 0, 1),
      periods: [
        { id: 'p4', year: 2024, isClosed: true, closedAt: new Date(2025, 0, 20) },
        { id: 'p5', year: 2025, isClosed: false, closedAt: null },
      ],
    },
    {
      id: faker.string.uuid(),
      name: 'Manual Entry Upload',
      description: 'Excel spreadsheet uploads for manual transactions',
      periodStart: new Date(2023, 0, 1),
      periods: [
        { id: 'p6', year: 2024, isClosed: true, closedAt: new Date(2025, 1, 1) },
        { id: 'p7', year: 2025, isClosed: false, closedAt: null },
      ],
    },
  ];

  getImportSources(): Observable<ImportSource[]> {
    return of([...this.importSources]).pipe(delay(300));
  }
}
