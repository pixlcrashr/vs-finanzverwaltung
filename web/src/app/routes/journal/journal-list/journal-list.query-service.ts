import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  JournalListDataService,
  JournalEntryFilters,
  JournalEntry,
} from './journal-list.data-service';

/**
 * Stateful wrapper around {@link JournalListDataService} that manages cursor
 * pagination for the journal list.
 *
 * The underlying data service is kept stateless; this service tracks the
 * current page token, filters, and organization so that the component can keep
 * requesting pages by number while the API is called with the correct token.
 */
@Injectable()
export class JournalListQueryService {
  private readonly dataService = inject(JournalListDataService);

  private state?: {
    organizationId: string;
    filters: JournalEntryFilters | undefined;
    currentPage: number;
    nextPageToken?: string;
    total: number;
  };

  fetchPage(
    organizationId: string,
    page: number,
    pageSize: number,
    filters?: JournalEntryFilters,
  ): Observable<{ entries: JournalEntry[]; total: number; nextPageToken?: string }> {
    // Reset pagination state when the organization or filters change, or when
    // the caller restarts from page 0.
    if (
      page === 0 ||
      !this.state ||
      this.state.organizationId !== organizationId ||
      !this.areFiltersEqual(this.state.filters, filters)
    ) {
      this.state = {
        organizationId,
        filters,
        currentPage: -1,
        nextPageToken: undefined,
        total: 0,
      };
    }

    // The caller is expected to request pages sequentially. If a non-sequential
    // page is requested, return an empty result from the current state.
    if (page !== this.state.currentPage + 1) {
      return of({
        entries: [],
        total: this.state.total,
        nextPageToken: this.state.nextPageToken,
      });
    }

    return this.dataService
      .listTransactions(organizationId, pageSize, this.state.nextPageToken, filters)
      .pipe(
        tap((result) => {
          this.state!.currentPage = page;
          this.state!.nextPageToken = result.nextPageToken;
          this.state!.total = result.total;
        }),
      );
  }

  private areFiltersEqual(
    a?: JournalEntryFilters,
    b?: JournalEntryFilters,
  ): boolean {
    if (a === b) {
      return true;
    }
    if (!a || !b) {
      return false;
    }
    return (
      a.afterDate === b.afterDate &&
      a.beforeDate === b.beforeDate &&
      a.query === b.query &&
      a.assignmentStatus === b.assignmentStatus
    );
  }
}
