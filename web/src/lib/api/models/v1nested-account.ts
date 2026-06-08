/* tslint:disable */
import { V1NestedAccount } from './v1nested-account';

/**
 * NestedAccount is a read-only view of an Account that includes its full
 * subtree of child accounts. It shares the same resource name as Account.
 */
export interface V1NestedAccount {

  /**
   * Child accounts in the subtree.
   */
  children?: Array<V1NestedAccount>;

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Short account code.
   */
  displayCode?: string;

  /**
   * Optional free-text description.
   */
  displayDescription?: string;

  /**
   * Human-readable account name.
   */
  displayName?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the account is archived.
   */
  isArchived?: boolean;

  /**
   * Whether this account is a container account.
   */
  isContainer?: boolean;
  name?: string;
  parentAccount?: string;

  /**
   * The UUID of the account.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
