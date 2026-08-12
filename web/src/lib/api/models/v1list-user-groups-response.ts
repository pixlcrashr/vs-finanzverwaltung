/* tslint:disable */
import { V1Group } from './v1group';

/**
 * ListUserGroupsResponse returns the groups a user belongs to.
 */
export interface V1ListUserGroupsResponse {

  /**
   * The groups the user is a member of.
   */
  groups?: Array<V1Group>;
}
