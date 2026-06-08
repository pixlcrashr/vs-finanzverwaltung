/* tslint:disable */
import { V1BudgetAccountValue } from './v1budget-account-value';
export interface V1ListBudgetAccountValuesResponse {

  /**
   * The budget account values returned.
   */
  account_values?: Array<V1BudgetAccountValue>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of account values matching the filter (may be an estimate).
   */
  total_size?: string;
}
