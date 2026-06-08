/* tslint:disable */
import { V1BudgetAccountValue } from './v1budget-account-value';
export interface V1ListBudgetAccountValuesResponse {

  /**
   * The budget account values returned.
   */
  accountValues?: Array<V1BudgetAccountValue>;

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of account values matching the filter (may be an estimate).
   */
  totalSize?: string;
}
