/* tslint:disable */
import { TypeDate } from './type-date';

/**
 * Budget represents a financial budget with a defined period.
 */
export interface V1Budget {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Optional free-text description.
   */
  displayDescription?: string;

  /**
   * Human-readable budget name.
   */
  displayName: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the budget is closed (no further modifications allowed).
   */
  isClosed?: boolean;
  name?: string;

  /**
   * Budget period end date.
   */
  periodEnd: TypeDate;

  /**
   * Budget period start date.
   */
  periodStart: TypeDate;

  /**
   * The UUID of the budget.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
