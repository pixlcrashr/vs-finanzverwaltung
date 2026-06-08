/* tslint:disable */
import { V1CheckUserOrganizationPermissionsRequest } from './v1check-user-organization-permissions-request';

/**
 * BatchCheckUserOrganizationPermissionsRequest checks permissions for a single
 * user across multiple organizations in one call (AIP-231 batch pattern).
 */
export interface UserServiceBatchCheckUserOrganizationPermissionsBody {

  /**
   * Individual per-organization check requests.
   * Maximum 100 entries per call.
   */
  requests: Array<V1CheckUserOrganizationPermissionsRequest>;
}
