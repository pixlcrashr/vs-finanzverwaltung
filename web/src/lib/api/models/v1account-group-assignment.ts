/* tslint:disable */

/**
 * AccountGroupAssignment associates an account with an account group.
 */
export interface V1AccountGroupAssignment {
  accountGroup?: string;

  /**
   * The UUID of the assigned account.
   */
  accountId: string;

  /**
   * Creation timestamp.
   */
  createTime?: string;

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
  updateTime?: string;
}
