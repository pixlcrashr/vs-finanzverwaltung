/* tslint:disable */
import { V1Group } from './v1group';
export interface V1ListGroupsResponse {

  /**
   * The groups returned.
   */
  groups?: Array<V1Group>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of groups matching the filter (may be an estimate).
   */
  total_size?: string;
}
