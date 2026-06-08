/* tslint:disable */

/**
 * UserIdentity is a read-only record of an OAuth2 / SSO connection linked to a
 * user.
 */
export interface V1UserIdentity {

  /**
   * Timestamp when this identity was first linked.
   */
  create_time?: string;

  /**
   * Display name as returned by the provider at last authentication.
   */
  display_name?: string;

  /**
   * E-mail address as returned by the provider at last authentication.
   */
  email?: string;

  /**
   * Timestamp of the most recent successful authentication via this identity.
   */
  last_authenticated_time?: string;
  name?: string;

  /**
   * The OAuth2 provider identifier (e.g. "google", "github", "azure").
   */
  provider?: string;

  /**
   * The subject identifier as issued by the provider.
   * This is the provider's stable user ID, not a credential.
   */
  provider_subject?: string;

  /**
   * The UUID of the identity record.
   */
  uid?: string;
}
