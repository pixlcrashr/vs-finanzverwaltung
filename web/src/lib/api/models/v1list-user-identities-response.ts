/* tslint:disable */
import { V1UserIdentity } from './v1user-identity';
export interface V1ListUserIdentitiesResponse {

  /**
   * The identities returned.
   */
  identities?: Array<V1UserIdentity>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of identities.
   */
  total_size?: string;
}
