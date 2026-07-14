/* tslint:disable */

/**
 * CheckUserPermissionsRequest checks which of the requested permissions a
 * user holds, optionally scoped to a domain.
 * When domain is empty, permissions are evaluated against the global
 * domain (e.g. users, groups, settings). When set, permissions are evaluated
 * against the specified domain (e.g. "organizations/{organization}").
 */
export interface V1CheckUserPermissionsRequest {

  /**
   * The domain to scope the check to (e.g. "organizations/{organization}").
   * If empty, permissions are checked against the global domain.
   */
  domain?: string;
  name: string;

  /**
   * The permissions to evaluate, as "resource:action" strings.
   * At least one must be provided. Only the permissions listed here
   * are evaluated and returned.
   */
  permissions: Array<string>;
}
