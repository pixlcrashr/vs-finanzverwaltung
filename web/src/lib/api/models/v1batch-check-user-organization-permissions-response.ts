/* tslint:disable */
import { V1CheckUserOrganizationPermissionsResponse } from './v1check-user-organization-permissions-response';

/**
 * BatchCheckUserOrganizationPermissionsResponse returns one result entry per
 * requested organization, in the same order as the request.
 */
export interface V1BatchCheckUserOrganizationPermissionsResponse {

  /**
   * One result per entry in BatchCheckUserOrganizationPermissionsRequest.requests,
   * in the same order.
   */
  results?: Array<V1CheckUserOrganizationPermissionsResponse>;
}
