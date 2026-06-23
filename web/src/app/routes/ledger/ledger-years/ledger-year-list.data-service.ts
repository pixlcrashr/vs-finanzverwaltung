import { Observable } from 'rxjs';

export interface LedgerYearListItem {
  id: string;
  name: string;
  year: number;
  isClosed: boolean;
  updateTime?: string;
  createTime?: string;
  etag?: string;
}

export abstract class LedgerYearListDataService {
  abstract listLedgerYears(
    organizationId: string,
    pageToken?: string
  ): Observable<{ years: LedgerYearListItem[]; nextPageToken?: string; totalSize: number }>;

  abstract closeLedgerYear(organizationId: string, id: string, etag?: string): Observable<LedgerYearListItem>;
}
