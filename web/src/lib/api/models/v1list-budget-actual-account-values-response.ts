/* tslint:disable */
import { V1BudgetActualAccountValue } from './v1budget-actual-account-value';
export interface V1ListBudgetActualAccountValuesResponse {

  /**
   * The actual account values returned.
   */
  actual_account_values?: Array<V1BudgetActualAccountValue>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of actual account values matching the filter (may be an estimate).
   */
  total_size?: string;
}
