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
  create_time?: string;

  /**
   * Short account code.
   */
  display_code?: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable account name.
   */
  display_name?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the account is archived.
   */
  is_archived?: boolean;

  /**
   * Whether this account is a container account.
   */
  is_container?: boolean;
  name?: string;
  parent_account?: string;

  /**
   * The UUID of the account.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
