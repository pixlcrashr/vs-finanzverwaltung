/* tslint:disable */
import { V1AccountGroup } from './v1account-group';
export interface V1ListAccountGroupsResponse {

  /**
   * The account groups returned.
   */
  account_groups?: Array<V1AccountGroup>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of account groups matching the filter (may be an estimate).
   */
  total_size?: string;
}
