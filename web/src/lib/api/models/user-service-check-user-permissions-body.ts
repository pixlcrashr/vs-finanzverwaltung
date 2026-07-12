/* tslint:disable */
import { V1Permission } from './v1permission';

/**
 * CheckUserPermissionsRequest checks which of the requested global
 * permissions a user holds, without scoping to any organization.
 * Only global resources (users, groups, settings, organizations) are
 * evaluated; org-scoped permissions will always be absent from the result.
 */
export interface UserServiceCheckUserPermissionsBody {

  /**
   * The permissions to evaluate. At least one must be provided.
   * Only the permissions listed here are evaluated and returned.
   */
  permissions: Array<V1Permission>;
}
