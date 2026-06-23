/* tslint:disable */
import { V1LedgerAccount } from './v1ledger-account';
export interface V1ListLedgerAccountsResponse {

  /**
   * The ledger accounts returned.
   */
  ledger_accounts?: Array<V1LedgerAccount>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of accounts matching the filter (may be an estimate).
   */
  total_size?: string;
}
