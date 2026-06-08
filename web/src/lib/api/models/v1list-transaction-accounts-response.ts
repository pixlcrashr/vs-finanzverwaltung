/* tslint:disable */
import { V1TransactionAccount } from './v1transaction-account';
export interface V1ListTransactionAccountsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of accounts matching the filter (may be an estimate).
   */
  totalSize?: string;

  /**
   * The transaction accounts returned.
   */
  transactionAccounts?: Array<V1TransactionAccount>;
}
