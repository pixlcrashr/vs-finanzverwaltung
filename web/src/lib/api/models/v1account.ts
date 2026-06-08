/* tslint:disable */

/**
 * Account represents a budget account in the chart of accounts.
 */
export interface V1Account {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Short account code.
   */
  display_code: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable account name.
   */
  display_name: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the account is archived (soft-deleted).
   */
  is_archived?: boolean;

  /**
   * Whether this account is a container account (cannot hold values directly).
   * Immutable after creation.
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
