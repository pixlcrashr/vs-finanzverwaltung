/* tslint:disable */
import { V1Account } from './v1account';
export interface V1ListAccountsResponse {

  /**
   * The accounts returned.
   */
  accounts?: Array<V1Account>;

  /**
   * A token to retrieve the next page of results.
   * Pass this value in ListAccountsRequest.page_token on the next call.
   */
  next_page_token?: string;

  /**
   * Total number of accounts matching the filter (may be an estimate).
   */
  total_size?: string;
}
