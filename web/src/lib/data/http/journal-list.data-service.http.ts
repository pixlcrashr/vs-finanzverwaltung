import { Injectable, inject } from '@angular/core';
import { Observable, EMPTY, combineLatest, map, of, switchMap, expand, reduce, catchError } from 'rxjs';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import { TransactionAssignmentServiceService } from '../../api/services/transaction-assignment-service.service';
import { LedgerAccountServiceService } from '../../api/services/ledger-account-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { V1TransactionAssignment } from '../../api/models/v1transaction-assignment';
import {
  JournalListDataService,
  JournalEntry,
  JournalEntryFilters,
  JournalAssignmentStatus,
  JournalAccountAssignment,
} from '../../../app/routes/journal/journal-list/journal-list.data-service';
import { extractUidFromResourceName } from './_mappers';

@Injectable()
export class HttpJournalListDataService extends JournalListDataService {
  private readonly txnSvc = inject(TransactionServiceService);
  private readonly assignmentSvc = inject(TransactionAssignmentServiceService);
  private readonly ledgerAccountSvc = inject(LedgerAccountServiceService);
  private readonly accountSvc = inject(AccountServiceService);

  listTransactions(
    organizationId: string,
    _page: number,
    pageSize: number,
    filters?: JournalEntryFilters,
  ): Observable<{ entries: JournalEntry[]; total: number }> {
    const parent = `organizations/${organizationId}`;

    // Step 1: fetch transactions, ledger accounts (for debit/credit code/name),
    // and budget accounts (for assignment code/name) in parallel.
    return combineLatest([
      this.txnSvc.TransactionServiceListTransactions({ parent, pageSize }),
      this.ledgerAccountSvc.LedgerAccountServiceListLedgerAccounts({ parent, pageSize: 100 }),
      this.accountSvc.AccountServiceListAccounts({ parent, pageSize: 100, showDeleted: false }),
    ]).pipe(
      switchMap(([txnResp, ledgerAccountsResp, accountsResp]) => {
        const transactions = txnResp.transactions ?? [];
        if (transactions.length === 0) {
          return of({ txnResp, ledgerAccountsResp, accountsResp, assignmentsByTxn: new Map<string, JournalAccountAssignment[]>() });
        }

        // Step 2: bulk-load transaction assignments for the organization
        // using the AIP wildcard parent notation
        // "organizations/{orgId}/transactions/-/assignments" (the server
        // interprets the "-" segment as "all transactions in the org").
        // We page through all results (the server caps page_size at 100) and
        // group assignments by transaction resource name client-side. No
        // AIP-160 filter is used — a filter that OR-concatenates every
        // transaction resource name would produce a URL/query string far
        // exceeding server limits, causing the request to fail silently.
        const wildcardParent = `organizations/${organizationId}/transactions/-`;
        return this.assignmentSvc
          .TransactionAssignmentServiceListTransactionAssignments({
            parent1: wildcardParent,
            pageSize: 100,
          })
          .pipe(
            expand((resp) =>
              resp.next_page_token
                ? this.assignmentSvc.TransactionAssignmentServiceListTransactionAssignments({
                    parent1: wildcardParent,
                    pageSize: 100,
                    pageToken: resp.next_page_token,
                  })
                : EMPTY,
            ),
            reduce(
              (all: V1TransactionAssignment[], resp) =>
                all.concat(resp.assignments ?? []),
              [],
            ),
            map((assignments) => {
              const accountsMap = new Map(
                (accountsResp.accounts ?? []).map((a) => [a.uid ?? '', a]),
              );
              // Group assignments by transaction resource name so each
              // JournalEntry can pick up its own list. The server sets the
              // assignment's "transaction" field to the full resource name
              // (organizations/{org}/transactions/{customId}), and the
              // transaction list's "name" field uses the same format.
              // Assignments for transactions outside the current page are
              // simply never looked up and are ignored.
              const assignmentsByTxn = new Map<string, JournalAccountAssignment[]>();
              for (const a of assignments) {
                const txnName = a.transaction ?? '';
                const accountUid = extractUidFromResourceName(a.account ?? '');
                const acct = accountsMap.get(accountUid);
                const assignment: JournalAccountAssignment = {
                  id: a.uid ?? '',
                  accountId: accountUid,
                  accountCode: acct?.display_code ?? '',
                  accountName: acct?.display_name ?? '',
                  value: a.value?.value ?? '',
                };
                const list = assignmentsByTxn.get(txnName) ?? [];
                list.push(assignment);
                assignmentsByTxn.set(txnName, list);
              }
              return { txnResp, ledgerAccountsResp, accountsResp, assignmentsByTxn };
            }),
            // If the bulk assignment load fails (e.g. wildcard parent not
            // supported), fall back to empty assignments so the journal list
            // still renders with transactions.
            catchError(() => of({
              txnResp,
              ledgerAccountsResp,
              accountsResp,
              assignmentsByTxn: new Map<string, JournalAccountAssignment[]>(),
            })),
          );
      }),
      map(({ txnResp, ledgerAccountsResp, assignmentsByTxn }) => {
        const ledgerAccountsMap = new Map(
          (ledgerAccountsResp.ledger_accounts ?? []).map((a) => [a.uid ?? '', a]),
        );

        const entries: JournalEntry[] = (txnResp.transactions ?? []).map((t) => {
          const debitUid = t.debit_ledger_account?.split('/').pop() ?? '';
          const creditUid = t.credit_ledger_account?.split('/').pop() ?? '';
          const debitAcct = ledgerAccountsMap.get(debitUid);
          const creditAcct = ledgerAccountsMap.get(creditUid);

          const assignments = assignmentsByTxn.get(t.name ?? '') ?? [];
          const amount = t.amount?.value ?? '';

          return {
            id: t.uid ?? '',
            documentDate: new Date(t.document_date),
            bookedAt: new Date(t.booked_at),
            amount,
            reference: t.reference ?? '',
            debitAccountCode: debitAcct?.code ?? '',
            debitAccountName: debitAcct?.display_name ?? '',
            creditAccountCode: creditAcct?.code ?? '',
            creditAccountName: creditAcct?.display_name ?? '',
            description: t.description ?? '',
            assignmentStatus: this.deriveAssignmentStatus(amount, assignments),
            accountAssignments: assignments,
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
        if (filters?.afterDate) {
          const after = new Date(filters.afterDate);
          filtered = filtered.filter((e) => e.documentDate >= after);
        }
        if (filters?.beforeDate) {
          const before = new Date(filters.beforeDate);
          before.setHours(23, 59, 59, 999);
          filtered = filtered.filter((e) => e.documentDate <= before);
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

  private deriveAssignmentStatus(
    amount: string,
    assignments: JournalAccountAssignment[],
  ): JournalAssignmentStatus {
    if (assignments.length === 0) {
      return 'open';
    }
    const total = parseFloat(amount);
    const assigned = assignments.reduce(
      (sum, a) => sum + parseFloat(a.value || '0'),
      0,
    );
    if (total > 0 && Math.abs(assigned - total) < 0.01) {
      return 'assigned';
    }
    return 'partial';
  }
}
