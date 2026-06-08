/* tslint:disable */
import { V1AccountGroup } from './v1account-group';
export interface V1ListAccountGroupsResponse {

  /**
   * The account groups returned.
   */
  accountGroups?: Array<V1AccountGroup>;

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of account groups matching the filter (may be an estimate).
   */
  totalSize?: string;
}
