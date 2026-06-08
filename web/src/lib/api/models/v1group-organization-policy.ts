/* tslint:disable */
import { V1Permission } from './v1permission';

/**
 * GroupOrganizationPolicy associates a set of permissions with a specific
 * organization for a group. A group may hold policies for multiple
 * organizations independently.
 */
export interface V1GroupOrganizationPolicy {
  organization: string;

  /**
   * The set of permissions granted within the organization.
   */
  permissions: Array<V1Permission>;
}
