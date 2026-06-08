/* tslint:disable */

/**
 * AccountGroupAssignment associates an account with an account group.
 */
export interface V1AccountGroupAssignment {
  account_group?: string;

  /**
   * The UUID of the assigned account.
   */
  account_id: string;

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * If true, this account is excluded (negated) from the group aggregate.
   */
  negate?: boolean;

  /**
   * The UUID of the assignment.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
