/* tslint:disable */

/**
 * Account represents a budget account in the chart of accounts.
 */
export interface V1Account {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Short account code.
   */
  displayCode: string;

  /**
   * Optional free-text description.
   */
  displayDescription?: string;

  /**
   * Human-readable account name.
   */
  displayName: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the account is archived (soft-deleted).
   */
  isArchived?: boolean;

  /**
   * Whether this account is a container account (cannot hold values directly).
   * Immutable after creation.
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
