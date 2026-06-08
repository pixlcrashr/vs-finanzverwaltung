/* tslint:disable */

/**
 * ImportSourcePeriod represents a fiscal year period within an import source.
 */
export interface V1ImportSourcePeriod {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  importSource?: string;

  /**
   * Whether this period is closed for new imports.
   */
  isClosed?: boolean;
  name?: string;

  /**
   * The UUID of the period.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;

  /**
   * The fiscal year this period covers.
   */
  year: number;
}
