/* tslint:disable */
import { V1Transaction } from './v1transaction';
export interface V1ListTransactionsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of transactions matching the filter (may be an estimate).
   */
  totalSize?: string;

  /**
   * The transactions returned.
   */
  transactions?: Array<V1Transaction>;
}
