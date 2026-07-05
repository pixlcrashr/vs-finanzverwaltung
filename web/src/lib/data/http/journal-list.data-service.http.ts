import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import { LedgerAccountServiceService } from '../../api/services/ledger-account-service.service';
import {
  JournalListDataService,
  JournalEntry,
  JournalEntryFilters,
  JournalAssignmentStatus,
  JournalAccountAssignment,
} from '../../../app/routes/journal/journal-list/journal-list.data-service';

@Injectable()
export class HttpJournalListDataService extends JournalListDataService {
  private readonly txnSvc = inject(TransactionServiceService);
  private readonly ledgerAccountSvc = inject(LedgerAccountServiceService);

  listTransactions(
    organizationId: string,
    _page: number,
    pageSize: number,
    filters?: JournalEntryFilters,
  ): Observable<{ entries: JournalEntry[]; total: number }> {
    const parent = `organizations/${organizationId}`;
    return combineLatest([
      this.txnSvc.TransactionServiceListTransactions({ parent, pageSize }),
      this.ledgerAccountSvc.LedgerAccountServiceListLedgerAccounts({ parent, pageSize: 100 }),
    ]).pipe(
      map(([txnResp, ledgerAccountsResp]) => {
        const ledgerAccountsMap = new Map(
          (ledgerAccountsResp.ledger_accounts ?? []).map((a) => [a.uid ?? '', a]),
        );

        const entries: JournalEntry[] = (txnResp.transactions ?? []).map((t) => {
          const debitUid = t.debit_ledger_account?.split('/').pop() ?? '';
          const creditUid = t.credit_ledger_account?.split('/').pop() ?? '';
          const debitAcct = ledgerAccountsMap.get(debitUid);
          const creditAcct = ledgerAccountsMap.get(creditUid);

          return {
            id: t.uid ?? '',
            documentDate: new Date(t.document_date),
            bookedAt: new Date(t.booked_at),
            amount: t.amount?.value ?? '',
            reference: t.reference ?? '',
            debitAccountCode: debitAcct?.code ?? '',
            debitAccountName: debitAcct?.display_name ?? '',
            creditAccountCode: creditAcct?.code ?? '',
            creditAccountName: creditAcct?.display_name ?? '',
            description: t.description ?? '',
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
