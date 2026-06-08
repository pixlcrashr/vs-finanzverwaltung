/* tslint:disable */
import { V1Decimal } from './v1decimal';

/**
 * BudgetRevisionAccountValue is an immutable record of a single account's
 * target value as captured at the time its parent BudgetRevision was created.
 * This resource is read-only; it cannot be created, updated, or deleted
 * directly — it is populated by the server when the parent BudgetRevision is
 * created.
 */
export interface V1BudgetRevisionAccountValue {

  /**
   * The UUID of the account whose value is recorded here.
   */
  account_id?: string;

  /**
   * Timestamp when this record was created (equals the revision create_time).
   */
  create_time?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;
  revision?: string;

  /**
   * The UUID of this record.
   */
  uid?: string;

  /**
   * The target monetary value for the account at the time the revision was
   * created.
   */
  value?: V1Decimal;
}
