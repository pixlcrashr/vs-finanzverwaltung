/* tslint:disable */
import { TypeDate } from './type-date';

/**
 * Budget represents a financial budget with a defined period.
 */
export interface V1Budget {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable budget name.
   */
  display_name: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the budget is closed (no further modifications allowed).
   */
  is_closed?: boolean;
  name?: string;

  /**
   * Budget period end date. Immutable after creation.
   */
  period_end: TypeDate;

  /**
   * Budget period start date. Immutable after creation.
   */
  period_start: TypeDate;

  /**
   * The UUID of the budget.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
