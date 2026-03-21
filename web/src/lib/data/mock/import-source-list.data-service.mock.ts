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
      name: 'Sparkasse Hauptkonto',
      description: 'Hauptgirokonto der Studierendenschaft',
      periodStart: new Date(2020, 0, 1),
      periods: [
        { id: 'p1', year: 2024, isClosed: true, closedAt: new Date(2025, 0, 15) },
        { id: 'p2', year: 2025, isClosed: true, closedAt: new Date(2026, 0, 10) },
        { id: 'p3', year: 2026, isClosed: false, closedAt: null },
      ],
    },
    {
      id: faker.string.uuid(),
      name: 'Volksbank Rücklagenkonto',
      description: 'Rücklagenkonto für größere Projekte',
      periodStart: new Date(2022, 0, 1),
      periods: [
        { id: 'p4', year: 2024, isClosed: true, closedAt: new Date(2025, 0, 20) },
        { id: 'p5', year: 2025, isClosed: false, closedAt: null },
      ],
    },
    {
      id: faker.string.uuid(),
      name: 'PayPal Veranstaltungen',
      description: 'PayPal-Konto für Veranstaltungseinnahmen',
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
