/* tslint:disable */
import { V1Decimal } from './v1decimal';

/**
 * BudgetActualAccountValue is a read-only, server-computed resource that
 * represents the actual monetary value for a single budget account within a
 * budget. The value is calculated by summing all TransactionAccountAssignment
 * values whose parent transactions fall within the budget's period.
 */
export interface V1BudgetActualAccountValue {

  /**
   * The budget account whose actual value is represented.
   */
  account?: string;
  budget?: string;
  name?: string;

  /**
   * The computed actual monetary value for this account, derived from the sum
   * of all matching TransactionAccountAssignment values within the budget period.
   */
  value?: V1Decimal;
}
