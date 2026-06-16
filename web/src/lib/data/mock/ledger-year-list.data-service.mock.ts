import { Observable, of, throwError } from 'rxjs';
import {
  LedgerYearListDataService,
  LedgerYearListItem,
} from '../../../app/routes/ledger/ledger-years/ledger-year-list.data-service';
import { faker } from '@faker-js/faker';

const mockYears: Map<string, LedgerYearListItem> = new Map();

function createMockYear(year: number): LedgerYearListItem {
  const id = faker.string.uuid();
  return {
    id,
    name: `organizations/test/ledgerYears/${id}`,
    year,
    isClosed: year < 2024,
    updateTime: faker.date.recent().toISOString(),
    createTime: faker.date.past().toISOString(),
    etag: faker.string.alphanumeric(16),
  };
}

// Initialize mock data
[2022, 2023, 2024, 2025].forEach((year) => {
  const item = createMockYear(year);
  mockYears.set(item.id, item);
});

export class MockLedgerYearListDataService implements LedgerYearListDataService {
  listLedgerYears(
    _organizationId: string,
    _pageToken?: string
  ): Observable<{ years: LedgerYearListItem[]; nextPageToken?: string; totalSize: number }> {
    const years = Array.from(mockYears.values()).sort((a, b) => b.year - a.year);
    return of({
      years,
      totalSize: years.length,
    });
  }

  closeLedgerYear(
    _organizationId: string,
    id: string,
    _etag?: string
  ): Observable<LedgerYearListItem> {
    const year = mockYears.get(id);
    if (!year) {
      return throwError(() => new Error('Year not found'));
    }

    if (year.isClosed) {
      return throwError(() => new Error('Year is already closed'));
    }

    const updated: LedgerYearListItem = {
      ...year,
      isClosed: true,
      updateTime: new Date().toISOString(),
      etag: faker.string.alphanumeric(16),
    };

    mockYears.set(id, updated);
    return of(updated);
  }
}
