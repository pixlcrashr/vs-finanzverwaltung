/* tslint:disable */
import { V1User } from './v1user';
export interface V1ListUsersResponse {

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of users matching the filter (may be an estimate).
   */
  total_size?: string;

  /**
   * The users returned.
   */
  users?: Array<V1User>;
}
