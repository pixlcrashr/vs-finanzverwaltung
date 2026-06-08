/* tslint:disable */
import { V1Permission } from './v1permission';

/**
 * CheckUserOrganizationPermissionsResponse reports which of the requested
 * permissions the user actually holds.
 */
export interface V1CheckUserOrganizationPermissionsResponse {
  organization?: string;

  /**
   * The subset of the requested permissions that the user holds.
   */
  permitted?: Array<V1Permission>;
}
