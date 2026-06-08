/* tslint:disable */
import { V1TransactionAccountAssignment } from './v1transaction-account-assignment';
export interface V1ListTransactionAccountAssignmentsResponse {

  /**
   * The assignments returned.
   */
  assignments?: Array<V1TransactionAccountAssignment>;

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of assignments matching the filter (may be an estimate).
   */
  totalSize?: string;
}
