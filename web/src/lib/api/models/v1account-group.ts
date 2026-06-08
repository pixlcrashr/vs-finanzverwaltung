/* tslint:disable */

/**
 * AccountGroup is a named grouping of budget accounts.
 */
export interface V1AccountGroup {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Optional free-text description.
   */
  displayDescription?: string;

  /**
   * Human-readable account group name.
   */
  displayName: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * The UUID of the account group.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
