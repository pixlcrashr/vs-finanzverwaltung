/* tslint:disable */

/**
 * CheckUserPermissionsResponse reports which of the requested permissions
 * the user actually holds.
 */
export interface V1CheckUserPermissionsResponse {

  /**
   * The domain that was evaluated, if any.
   * Empty if the check was global.
   */
  domain?: string;

  /**
   * The subset of the requested permissions that the user holds.
   */
  permitted?: Array<string>;
}
