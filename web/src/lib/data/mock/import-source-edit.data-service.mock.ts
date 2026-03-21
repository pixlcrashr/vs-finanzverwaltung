import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { faker } from '@faker-js/faker';
import { ImportSource } from '../../../app/shared/models';
import {
  ImportSourceEditDataService,
  UpdateImportSourceInput,
} from '../../../app/routes/admin/import-sources/import-source-edit.data-service';

@Injectable()
export class MockImportSourceEditDataService extends ImportSourceEditDataService {
  private importSource: ImportSource = {
    id: faker.string.uuid(),
    name: 'Sparkasse Hauptkonto',
    description: 'Hauptgirokonto der Studierendenschaft',
    periodStart: new Date(2020, 0, 1),
    periods: [
      { id: 'p1', year: 2024, isClosed: true, closedAt: new Date(2025, 0, 15) },
      { id: 'p2', year: 2025, isClosed: true, closedAt: new Date(2026, 0, 10) },
      { id: 'p3', year: 2026, isClosed: false, closedAt: null },
    ],
  };

  getImportSource(id: string): Observable<ImportSource> {
    return of({ ...this.importSource, id }).pipe(delay(300));
  }

  updateImportSource(id: string, input: UpdateImportSourceInput): Observable<ImportSource> {
    this.importSource = {
      ...this.importSource,
      id,
      name: input.name,
      description: input.description,
    };
    return of({ ...this.importSource }).pipe(delay(400));
  }

  closePeriod(sourceId: string, periodId: string): Observable<void> {
    const period = this.importSource.periods.find((p) => p.id === periodId);
    if (period) {
      period.isClosed = true;
      period.closedAt = new Date();
    }
    return of(undefined).pipe(delay(400));
  }
}
