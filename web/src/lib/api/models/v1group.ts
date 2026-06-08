/* tslint:disable */
import { V1GroupOrganizationPolicy } from './v1group-organization-policy';

/**
 * Group is a named collection of users that share a common set of permissions,
 * scoped per organization via GroupOrganizationPolicy.
 */
export interface V1Group {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable group name.
   */
  display_name: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * Per-organization permission policies for this group.
   * Each entry associates a distinct organization with a set of permissions.
   * Multiple entries for the same organization are not allowed.
   */
  organization_policies?: Array<V1GroupOrganizationPolicy>;

  /**
   * The UUID of the group.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
