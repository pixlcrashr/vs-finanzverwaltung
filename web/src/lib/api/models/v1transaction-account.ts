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
  createTime?: string;

  /**
   * Optional free-text description.
   */
  displayDescription?: string;

  /**
   * Human-readable name.
   */
  displayName?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * UUID of the import source this account belongs to.
   */
  importSourceId: string;
  name?: string;

  /**
   * The UUID of the transaction account.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
