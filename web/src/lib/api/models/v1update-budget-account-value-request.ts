/* tslint:disable */
import { V1BudgetAccountValue } from './v1budget-account-value';
export interface V1UpdateBudgetAccountValueRequest {

  /**
   * The budget account value to update.
   */
  account_value: V1BudgetAccountValue;

  /**
   * If set to true, and the resource is not found, a new resource will be
   * created. In this situation, update_mask is ignored.
   */
  allow_missing?: boolean;

  /**
   * The list of fields to update.
   */
  update_mask?: string;
}
