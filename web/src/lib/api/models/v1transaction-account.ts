/* tslint:disable */

/**
 * TransactionAccount is an external account from an import source
 * (e.g. a bank account) involved in transactions.
 */
export interface V1TransactionAccount {

  /**
   * Unique account code (e.g. IBAN or internal code).
   */
  code: string;

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable name.
   */
  display_name?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * UUID of the import source this account belongs to.
   */
  import_source_id: string;
  name?: string;

  /**
   * The UUID of the transaction account.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
