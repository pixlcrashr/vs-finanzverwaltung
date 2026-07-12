/* tslint:disable */
import { V1CheckUserPermissionsRequest } from './v1check-user-permissions-request';

/**
 * BatchCheckUserPermissionsRequest checks global permissions for multiple
 * users in one call (AIP-231 batch pattern).
 */
export interface V1BatchCheckUserPermissionsRequest {

  /**
   * Individual per-user check requests. Maximum 100 entries per call.
   */
  requests: Array<V1CheckUserPermissionsRequest>;
}
