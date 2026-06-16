/* tslint:disable */
import { V1TransactionAssignment } from './v1transaction-assignment';
export interface V1ListTransactionAssignmentsResponse {

  /**
   * The transaction assignments returned.
   */
  assignments?: Array<V1TransactionAssignment>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of assignments matching the filter (may be an estimate).
   */
  total_size?: string;
}
