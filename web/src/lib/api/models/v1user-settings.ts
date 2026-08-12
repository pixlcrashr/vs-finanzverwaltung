/* tslint:disable */

/**
 * UserSettings holds per-user application preferences.
 */
export interface V1UserSettings {

  /**
   * Whether the user wants to receive email notifications.
   */
  email_notifications?: boolean;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;

  /**
   * Preferred locale/language tag (e.g. "de-DE").
   */
  locale?: string;
  name?: string;

  /**
   * Preferred UI theme: "light", "dark", or "system".
   */
  theme?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
