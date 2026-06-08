/* tslint:disable */
import { V1AccountGroupAssignment } from './v1account-group-assignment';
export interface V1ListAccountGroupAssignmentsResponse {

  /**
   * The assignments returned.
   */
  assignments?: Array<V1AccountGroupAssignment>;

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of assignments matching the filter (may be an estimate).
   */
  totalSize?: string;
}
