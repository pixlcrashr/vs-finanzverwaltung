/* tslint:disable */
import { V1Permission } from './v1permission';

/**
 * CheckUserOrganizationPermissionsRequest checks which of the requested
 * permissions a user holds within a single organization.
 */
export interface UserServiceCheckUserOrganizationPermissionsBody {
  organization: string;

  /**
   * The permissions to evaluate. At least one must be provided.
   * Only the permissions listed here are evaluated and returned.
   */
  permissions: Array<V1Permission>;
}
