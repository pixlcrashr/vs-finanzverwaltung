/* tslint:disable */
import { V1BudgetRevisionAccountValue } from './v1budget-revision-account-value';
export interface V1ListBudgetRevisionAccountValuesResponse {

  /**
   * The account values returned.
   */
  accountValues?: Array<V1BudgetRevisionAccountValue>;

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of account values in this revision.
   */
  totalSize?: string;
}
