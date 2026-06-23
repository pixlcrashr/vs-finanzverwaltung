import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  LedgerYearListDataService,
  LedgerYearListItem,
} from '../../../app/routes/ledger/ledger-years/ledger-year-list.data-service';
import { LedgerYearServiceService } from '../../api/services/ledger-year-service.service';

@Injectable({ providedIn: 'root' })
export class HttpLedgerYearListDataService implements LedgerYearListDataService {
  constructor(private readonly api: LedgerYearServiceService) {}

  listLedgerYears(
    organizationId: string,
    pageToken?: string
  ): Observable<{ years: LedgerYearListItem[]; nextPageToken?: string; totalSize: number }> {
    const parent = `organizations/${organizationId}`;

    return this.api
      .LedgerYearServiceListLedgerYears({
        parent,
        pageToken,
        pageSize: 50,
        orderBy: 'year desc',
      })
      .pipe(
        map((response) => ({
          years:
            response.ledger_years?.map((year) => ({
              id: year.uid || '',
              name: year.name || '',
              year: year.year || 0,
              isClosed: year.is_closed || false,
              updateTime: year.update_time,
              createTime: year.create_time,
              etag: year.etag,
            })) || [],
          nextPageToken: response.next_page_token,
          totalSize: Number(response.total_size) || 0,
        }))
      );
  }

  closeLedgerYear(
    organizationId: string,
    id: string,
    _etag?: string
  ): Observable<LedgerYearListItem> {
    const name = `organizations/${organizationId}/ledgerYears/${id}`;

    return this.api
      .LedgerYearServiceCloseLedgerYear({
        name1: name,
        body: {},
      })
      .pipe(
        map((year) => ({
          id: year.uid || '',
          name: year.name || '',
          year: year.year || 0,
          isClosed: year.is_closed || false,
          updateTime: year.update_time,
          createTime: year.create_time,
          etag: year.etag,
        }))
      );
  }
}
