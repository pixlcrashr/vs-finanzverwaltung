/* tslint:disable */

/**
 * LedgerYear represents a fiscal/economic year within an organization.
 */
export interface V1LedgerYear {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether this year is closed for new imports.
   */
  is_closed?: boolean;
  name?: string;

  /**
   * The UUID of the ledger year.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;

  /**
   * The fiscal year this ledger year covers.
   */
  year: number;
}
