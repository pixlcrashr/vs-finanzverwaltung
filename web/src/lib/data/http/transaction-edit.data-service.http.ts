import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { TransactionServiceService } from '../../api/services/transaction-service.service';
import { TransactionAccountAssignmentServiceService } from '../../api/services/transaction-account-assignment-service.service';
import { TransactionAccountServiceService } from '../../api/services/transaction-account-service.service';
import { AccountServiceService } from '../../api/services/account-service.service';
import { CurrentOrganizationService } from '../../../app/shared/services/current-organization.service';
import { Transaction, Account } from '../../../app/shared/models';
import { TransactionEditDataService } from '../../../app/routes/transactions/transaction-edit/transaction-edit.data-service';
import { mapApiAccount, mapApiTransaction, mapApiTransactionAccountAssignment } from './_mappers';

@Injectable()
export class HttpTransactionEditDataService extends TransactionEditDataService {
  private readonly txnSvc = inject(TransactionServiceService);
  private readonly assignmentSvc = inject(TransactionAccountAssignmentServiceService);
  private readonly txnAccountSvc = inject(TransactionAccountServiceService);
  private readonly accountSvc = inject(AccountServiceService);
  private readonly orgSvc = inject(CurrentOrganizationService);

  private get parent(): string {
    return `organizations/${this.orgSvc.currentOrganization()!.id}`;
  }

  private txnName(uid: string): string {
    return `${this.parent}/transactions/${uid}`;
  }

  private assignmentName(txnId: string, assignmentId: string): string {
    return `${this.txnName(txnId)}/assignments/${assignmentId}`;
  }

  getTransaction(id: string): Observable<Transaction> {
    const txnName = this.txnName(id);
    return combineLatest([
      this.txnSvc.TransactionServiceGetTransaction(txnName),
      this.assignmentSvc.TransactionAccountAssignmentServiceListTransactionAccountAssignments({ parent1: txnName, pageSize: 100 }),
      this.txnAccountSvc.TransactionAccountServiceListTransactionAccounts({ parent: this.parent, pageSize: 100 }),
      this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: false }),
    ]).pipe(
      map(([txn, assignmentsResp, txnAccountsResp, accountsResp]) => {
        const txnAccountsMap = new Map(
          (txnAccountsResp.transaction_accounts ?? []).map((a) => [a.uid ?? '', a]),
        );
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.uid ?? '', a]),
        );

        const debitTxnAccount = txnAccountsMap.get(txn.debit_transaction_account_id ?? '');
        const creditTxnAccount = txnAccountsMap.get(txn.credit_transaction_account_id ?? '');

        const assignments = (assignmentsResp.assignments ?? []).map((a) => {
          const acct = accountsMap.get(a.account_id);
          return mapApiTransactionAccountAssignment(
            a,
            acct?.display_code ?? '',
            acct?.display_name ?? '',
          );
        });

        return mapApiTransaction(
          txn,
          debitTxnAccount?.code ?? '',
          debitTxnAccount?.display_name ?? '',
          creditTxnAccount?.code ?? '',
          creditTxnAccount?.display_name ?? '',
          assignments,
        );
      }),
    );
  }

  updateTransaction(id: string, description: string): Observable<Transaction> {
    const name = this.txnName(id);
    return this.txnSvc.TransactionServiceGetTransaction(name).pipe(
      switchMap((existing) =>
        this.txnSvc.TransactionServiceUpdateTransaction({
          transactionName: name,
          transaction: {
            ...existing,
            credit_transaction_account_id: existing.credit_transaction_account_id,
            debit_transaction_account_id: existing.debit_transaction_account_id,
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

  getAvailableAccounts(): Observable<Account[]> {
    return this.accountSvc.AccountServiceListAccounts({ parent: this.parent, pageSize: 100, showDeleted: false }).pipe(
      map((resp) => (resp.accounts ?? []).map(mapApiAccount)),
    );
  }

  addAssignment(transactionId: string, accountId: string, value: string): Observable<void> {
    return this.assignmentSvc.TransactionAccountAssignmentServiceCreateTransactionAccountAssignment({
      parent1: this.txnName(transactionId),
      assignment: { account_id: accountId, value: { value } },
    }).pipe(map(() => undefined));
  }

  removeAssignment(transactionId: string, assignmentId: string): Observable<void> {
    return this.assignmentSvc.TransactionAccountAssignmentServiceDeleteTransactionAccountAssignment(
      this.assignmentName(transactionId, assignmentId),
    ).pipe(map(() => undefined));
  }
}
