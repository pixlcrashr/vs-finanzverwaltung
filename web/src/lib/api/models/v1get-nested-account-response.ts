/* tslint:disable */
import { V1NestedAccount } from './v1nested-account';

/**
 * Response for the GetNestedAccount custom method.
 */
export interface V1GetNestedAccountResponse {

  /**
   * The requested account with its full nested subtree.
   */
  account?: V1NestedAccount;
}
