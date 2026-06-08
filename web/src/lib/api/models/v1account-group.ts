/* tslint:disable */

/**
 * AccountGroup is a named grouping of budget accounts.
 */
export interface V1AccountGroup {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable account group name.
   */
  display_name: string;

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
  update_time?: string;
}
