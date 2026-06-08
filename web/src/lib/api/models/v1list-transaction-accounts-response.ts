/* tslint:disable */
import { V1TransactionAccount } from './v1transaction-account';
export interface V1ListTransactionAccountsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of accounts matching the filter (may be an estimate).
   */
  total_size?: string;

  /**
   * The transaction accounts returned.
   */
  transaction_accounts?: Array<V1TransactionAccount>;
}
