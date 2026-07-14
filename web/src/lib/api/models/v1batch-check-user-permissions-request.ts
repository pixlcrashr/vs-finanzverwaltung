/* tslint:disable */
import { V1CheckUserPermissionsRequest } from './v1check-user-permissions-request';

/**
 * BatchCheckUserPermissionsRequest checks permissions for one or more users
 * in a single call (AIP-231 batch pattern). Each entry can target a different
 * domain (or the global domain when domain is empty).
 */
export interface V1BatchCheckUserPermissionsRequest {

  /**
   * Individual check requests. Maximum 100 entries per call.
   */
  requests: Array<V1CheckUserPermissionsRequest>;
}
