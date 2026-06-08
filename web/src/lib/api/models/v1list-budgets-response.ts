/* tslint:disable */
import { V1Budget } from './v1budget';
export interface V1ListBudgetsResponse {

  /**
   * The budgets returned.
   */
  budgets?: Array<V1Budget>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of budgets matching the filter (may be an estimate).
   */
  total_size?: string;
}
