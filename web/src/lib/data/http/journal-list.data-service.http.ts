import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  listTransactions,
  listTransactionAccounts,
  listTransactionAccountAssignments,
  listAccounts,
} from '../../api/functions';
import {
  JournalListDataService,
  JournalEntry,
  JournalEntryFilters,
  JournalAssignmentStatus,
  JournalAccountAssignment,
} from '../../../app/routes/journal/journal-list/journal-list.data-service';

@Injectable()
export class HttpJournalListDataService extends JournalListDataService {
  private readonly api = inject(Api);

  getEntries(
    page: number,
    pageSize: number,
    filters?: JournalEntryFilters,
  ): Observable<{ entries: JournalEntry[]; total: number }> {
    return from(
      Promise.all([
        this.api.invoke(listTransactions, {
          pageSize,
          bookedAtStart: filters?.afterDate,
          bookedAtEnd: filters?.beforeDate,
        }),
        this.api.invoke(listTransactionAccounts, { pageSize: 100 }),
        this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
      ]),
    ).pipe(
      map(([txnResp, txnAccountsResp, accountsResp]) => {
        const txnAccountsMap = new Map(
          (txnAccountsResp.transactionAccounts ?? []).map((a) => [a.id, a]),
        );
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.id, a]),
        );

        const entries: JournalEntry[] = (txnResp.transactions ?? []).map((t) => {
          const debitAcct = txnAccountsMap.get(t.debitTransactionAccountId);
          const creditAcct = txnAccountsMap.get(t.creditTransactionAccountId);

          return {
            id: t.id,
            documentDate: new Date(t.documentDate),
            bookedAt: new Date(t.bookedAt),
            amount: t.amount,
            reference: t.reference,
            debitAccountCode: debitAcct?.code ?? '',
            debitAccountName: debitAcct?.displayName ?? '',
            creditAccountCode: creditAcct?.code ?? '',
            creditAccountName: creditAcct?.displayName ?? '',
            description: t.description,
            assignmentStatus: 'open' as JournalAssignmentStatus,
            accountAssignments: [],
          };
        });

        let filtered = entries;
        if (filters?.query) {
          const q = filters.query.toLowerCase();
          filtered = filtered.filter(
            (e) =>
              e.description.toLowerCase().includes(q) ||
              e.reference.toLowerCase().includes(q) ||
              e.debitAccountName.toLowerCase().includes(q) ||
              e.creditAccountName.toLowerCase().includes(q),
          );
        }
        if (filters?.assignmentStatus && filters.assignmentStatus !== 'all') {
          filtered = filtered.filter(
            (e) => e.assignmentStatus === filters.assignmentStatus,
          );
        }

        return {
          entries: filtered,
          total: filtered.length,
        };
      }),
    );
  }
}
