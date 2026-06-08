import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import { TransactionAccountServiceService } from '../../api/services/transaction-account-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
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
  private readonly txnAccountSvc = inject(TransactionAccountServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  getEntries(
    _page: number,
    pageSize: number,
    filters?: JournalEntryFilters,
  ): Observable<{ entries: JournalEntry[]; total: number }> {
    return combineLatest([
      this.txnSvc.TransactionServiceListTransactions({ parent: this.parent, pageSize }),
      this.txnAccountSvc.TransactionAccountServiceListTransactionAccounts({ parent: this.parent, pageSize: 100 }),
    ]).pipe(
      map(([txnResp, txnAccountsResp]) => {
        const txnAccountsMap = new Map(
          (txnAccountsResp.transaction_accounts ?? []).map((a) => [a.uid ?? '', a]),
        );

        const entries: JournalEntry[] = (txnResp.transactions ?? []).map((t) => {
          const debitAcct = txnAccountsMap.get(t.debit_transaction_account_id ?? '');
          const creditAcct = txnAccountsMap.get(t.credit_transaction_account_id ?? '');

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
