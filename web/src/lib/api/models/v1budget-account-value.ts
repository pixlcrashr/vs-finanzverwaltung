/* tslint:disable */
import { V1Decimal } from './v1decimal';

/**
 * BudgetAccountValue associates an account with a numeric target value within
 * a budget. Accounts may optionally be assigned a value; not all accounts in
 * the system need to be present.
 */
export interface V1BudgetAccountValue {

  /**
   * The UUID of the account this value is assigned to.
   */
  account_id: string;
  budget?: string;

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * The UUID of the budget account value.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;

  /**
   * The target monetary value assigned to the account for this budget.
   */
  value: V1Decimal;
}
