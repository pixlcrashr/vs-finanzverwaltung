/* tslint:disable */

/**
 * Organization is the top-level resource that owns all other resources.
 */
export interface V1Organization {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Human-readable organization name.
   */
  displayName: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * The UUID of the organization.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
