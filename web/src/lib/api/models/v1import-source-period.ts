/* tslint:disable */

/**
 * ImportSourcePeriod represents a fiscal year period within an import source.
 */
export interface V1ImportSourcePeriod {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  import_source?: string;

  /**
   * Whether this period is closed for new imports.
   */
  is_closed?: boolean;
  name?: string;

  /**
   * The UUID of the period.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;

  /**
   * The fiscal year this period covers.
   */
  year: number;
}
