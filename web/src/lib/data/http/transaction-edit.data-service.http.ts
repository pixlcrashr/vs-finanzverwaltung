import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  getTransaction,
  updateTransaction,
  listAccounts,
  listTransactionAccounts,
  listTransactionAccountAssignments,
  createTransactionAccountAssignment,
  deleteTransactionAccountAssignment,
} from '../../api/functions';
import { Transaction, Account } from '../../../app/shared/models';
import { TransactionEditDataService } from '../../../app/routes/transactions/transaction-edit/transaction-edit.data-service';
import { mapApiAccount, mapApiTransaction, mapApiTransactionAccountAssignment } from './_mappers';

@Injectable()
export class HttpTransactionEditDataService extends TransactionEditDataService {
  private readonly api = inject(Api);

  getTransaction(id: string): Observable<Transaction> {
    return from(
      Promise.all([
        this.api.invoke(getTransaction, { transactionId: id }),
        this.api.invoke(listTransactionAccountAssignments, { transactionId: id, pageSize: 100 }),
        this.api.invoke(listTransactionAccounts, { pageSize: 100 }),
        this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
      ]),
    ).pipe(
      map(([txn, assignmentsResp, txnAccountsResp, accountsResp]) => {
        const txnAccountsMap = new Map(
          (txnAccountsResp.transactionAccounts ?? []).map((a) => [a.id, a]),
        );
        const accountsMap = new Map(
          (accountsResp.accounts ?? []).map((a) => [a.id, a]),
        );

        const debitTxnAccount = txnAccountsMap.get(txn.debitTransactionAccountId);
        const creditTxnAccount = txnAccountsMap.get(txn.creditTransactionAccountId);

        const assignments = (assignmentsResp.assignments ?? []).map((a) => {
          const acct = accountsMap.get(a.accountId);
          return mapApiTransactionAccountAssignment(
            a,
            acct?.displayCode ?? '',
            acct?.displayName ?? '',
          );
        });

        return mapApiTransaction(
          txn,
          debitTxnAccount?.code ?? '',
          debitTxnAccount?.displayName ?? '',
          creditTxnAccount?.code ?? '',
          creditTxnAccount?.displayName ?? '',
          assignments,
        );
      }),
    );
  }

  updateTransaction(id: string, description: string): Observable<Transaction> {
    return from(
      this.api.invoke(updateTransaction, {
        transactionId: id,
        body: { description },
      }),
    ).pipe(
      map((txn) =>
        mapApiTransaction(txn, '', '', '', '', []),
      ),
    );
  }

  getAvailableAccounts(): Observable<Account[]> {
    return from(
      this.api.invoke(listAccounts, { pageSize: 100, showDeleted: false }),
    ).pipe(map((resp) => (resp.accounts ?? []).map(mapApiAccount)));
  }

  addAssignment(transactionId: string, accountId: string, value: string): Observable<void> {
    return from(
      this.api.invoke(createTransactionAccountAssignment, {
        transactionId,
        body: { accountId, value },
      }),
    ).pipe(map(() => undefined));
  }

  removeAssignment(transactionId: string, assignmentId: string): Observable<void> {
    return from(
      this.api.invoke(deleteTransactionAccountAssignment, {
        transactionId,
        assignmentId,
      }),
    ).pipe(map(() => undefined));
  }
}
