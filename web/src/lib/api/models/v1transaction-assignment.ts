/* tslint:disable */
import { V1Decimal } from './v1decimal';

/**
 * TransactionAssignment represents the assignment of a transaction to a budget account.
 * This splits transaction amounts across accounts for budgeting purposes.
 */
export interface V1TransactionAssignment {
  account: string;

  /**
   * Creation timestamp.
   */
  create_time?: string;
  name?: string;
  transaction: string;

  /**
   * The UUID of the transaction assignment.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;

  /**
   * The assigned value amount.
   */
  value: V1Decimal;
}
