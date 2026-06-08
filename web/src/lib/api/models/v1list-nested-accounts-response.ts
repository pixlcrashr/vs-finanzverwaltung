/* tslint:disable */
import { V1NestedAccount } from './v1nested-account';

/**
 * Response for the ListNestedAccounts custom method.
 */
export interface V1ListNestedAccountsResponse {

  /**
   * Root-level accounts, each carrying their full nested subtree.
   */
  accounts?: Array<V1NestedAccount>;
}
