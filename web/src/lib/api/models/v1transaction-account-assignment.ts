/* tslint:disable */
import { V1Decimal } from './v1decimal';

/**
 * TransactionAccountAssignment maps a transaction to a budget account with a
 * partial monetary value (split booking).
 */
export interface V1TransactionAccountAssignment {

  /**
   * UUID of the budget account this portion of the transaction is assigned to.
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
  transaction?: string;

  /**
   * The UUID of the assignment.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;

  /**
   * The decimal value assigned to this account.
   */
  value: V1Decimal;
}
