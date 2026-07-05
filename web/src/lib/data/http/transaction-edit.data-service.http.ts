import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import { TransactionAssignmentServiceService } from '../../api/services/transaction-assignment-service.service';
import { LedgerAccountServiceService } from '../../api/services/ledger-account-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { Transaction, Account } from '../../../app/shared/models';
import { TransactionEditDataService } from '../../../app/routes/transactions/transaction-edit/transaction-edit.data-service';
import { mapApiAccount, mapApiTransaction, mapApiTransactionAssignment } from './_mappers';

@Injectable()
export class HttpTransactionEditDataService extends TransactionEditDataService {
  private readonly txnSvc = inject(TransactionServiceService);
  private readonly assignmentSvc = inject(TransactionAssignmentServiceService);
  private readonly ledgerAccountSvc = inject(LedgerAccountServiceService);
  private readonly accountSvc = inject(AccountServiceService);

  private txnName(organizationId: string, uid: string): string {
    return `organizations/${organizationId}/transactions/${uid}`;
  }

  getTransaction(organizationId: string, id: string): Observable<Transaction> {
    const txnName = this.txnName(organizationId, id);
    const parent = `organizations/${organizationId}`;
    return combineLatest([
      this.txnSvc.TransactionServiceGetTransaction(txnName),
      this.assignmentSvc.TransactionAssignmentServiceListTransactionAssignments({ parent1: txnName, pageSize: 100 }),
      this.ledgerAccountSvc.LedgerAccountServiceListLedgerAccounts({ parent, pageSize: 100 }),
      this.accountSvc.AccountServiceListAccounts({ parent, pageSize: 100, showDeleted: false }),
    ]).pipe(
      map(([txn, assignmentsResp, ledgerAccountsResp, accountsResp]) => {
        const ledgerAccountsMap = new Map(
          (ledgerAccountsResp.ledger_accounts ?? []).map((a) => [a.uid ?? '', a]),
        );
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.uid ?? '', a]),
        );

        const debitUid = txn.debit_ledger_account?.split('/').pop() ?? '';
        const creditUid = txn.credit_ledger_account?.split('/').pop() ?? '';

        const debitLedgerAccount = ledgerAccountsMap.get(debitUid);
        const creditLedgerAccount = ledgerAccountsMap.get(creditUid);

        const assignments = (assignmentsResp.assignments ?? []).map((a) => {
          const accountUid = a.account?.split('/').pop() ?? '';
          const acct = accountsMap.get(accountUid);
          return mapApiTransactionAssignment(
            a,
            acct?.display_code ?? '',
            acct?.display_name ?? '',
          );
        });

        return mapApiTransaction(
          txn,
          debitLedgerAccount?.code ?? '',
          debitLedgerAccount?.display_name ?? '',
          creditLedgerAccount?.code ?? '',
          creditLedgerAccount?.display_name ?? '',
          assignments,
        );
      }),
    );
  }

  updateTransaction(organizationId: string, id: string, description: string): Observable<Transaction> {
    const name = this.txnName(organizationId, id);
    return this.txnSvc.TransactionServiceGetTransaction(name).pipe(
      switchMap((existing) =>
        this.txnSvc.TransactionServiceUpdateTransaction({
          transactionName: name,
          transaction: {
            ...existing,
            credit_ledger_account: existing.credit_ledger_account,
            debit_ledger_account: existing.debit_ledger_account,
            amount: existing.amount,
            booked_at: existing.booked_at,
            document_date: existing.document_date,
            description,
          },
        }),
      ),
      map((txn) => mapApiTransaction(txn, '', '', '', '', [])),
    );
  }

  listAvailableAccounts(organizationId: string): Observable<Account[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: `organizations/${organizationId}`, pageSize: 100, showDeleted: false }).pipe(
      map((resp) => (resp.accounts ?? []).map(mapApiAccount)),
    );
  }
}
