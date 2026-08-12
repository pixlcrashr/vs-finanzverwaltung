/* tslint:disable */
import { V1Account } from './v1account';

/**
 * NestedAccount is a read-only view of an Account that includes its full
 * subtree of child accounts. It shares the same resource name as Account.
 */
export interface V1NestedAccount {
  account?: V1Account;

  /**
   * Child accounts in the subtree.
   */
  children?: Array<V1NestedAccount>;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  parent_account?: string;
}
