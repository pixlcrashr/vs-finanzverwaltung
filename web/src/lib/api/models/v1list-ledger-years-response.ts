/* tslint:disable */
import { V1LedgerYear } from './v1ledger-year';
export interface V1ListLedgerYearsResponse {

  /**
   * The ledger years returned.
   */
  ledger_years?: Array<V1LedgerYear>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of ledger years matching the filter (may be an estimate).
   */
  total_size?: string;
}
