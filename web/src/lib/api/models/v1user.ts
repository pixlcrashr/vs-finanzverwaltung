/* tslint:disable */

/**
 * User represents a human actor that can log in via SSO.
 * Users are created exclusively through the SSO/OAuth2 flow; this service
 * exposes a read-only view for administration purposes.
 */
export interface V1User {

  /**
   * Creation timestamp (first SSO login).
   */
  create_time?: string;

  /**
   * Primary display name (derived from SSO provider at last login).
   */
  display_name?: string;

  /**
   * Primary e-mail address (derived from SSO provider at last login).
   */
  email?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Whether the user account is active.
   */
  is_active?: boolean;
  name?: string;

  /**
   * The UUID of the user.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
