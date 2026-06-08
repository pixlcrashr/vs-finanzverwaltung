/* tslint:disable */
import { V1BudgetRevision } from './v1budget-revision';
export interface V1ListBudgetRevisionsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * The revisions returned, ordered reverse-chronologically by default.
   */
  revisions?: Array<V1BudgetRevision>;

  /**
   * Total number of revisions for this budget.
   */
  totalSize?: string;
}
