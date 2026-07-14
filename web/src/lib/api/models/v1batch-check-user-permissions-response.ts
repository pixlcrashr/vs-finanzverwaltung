/* tslint:disable */
import { V1CheckUserPermissionsResponse } from './v1check-user-permissions-response';

/**
 * BatchCheckUserPermissionsResponse returns one result entry per requested
 * check, in the same order as the request.
 */
export interface V1BatchCheckUserPermissionsResponse {

  /**
   * One result per entry in BatchCheckUserPermissionsRequest.requests,
   * in the same order.
   */
  results?: Array<V1CheckUserPermissionsResponse>;
}
