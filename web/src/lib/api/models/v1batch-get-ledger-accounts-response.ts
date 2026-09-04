/* tslint:disable */
import { V1LedgerAccount } from './v1ledger-account';
export interface V1BatchGetLedgerAccountsResponse {

  /**
   * The ledger accounts returned, in the same order as the names in the request.
   */
  ledger_accounts?: Array<V1LedgerAccount>;
}
