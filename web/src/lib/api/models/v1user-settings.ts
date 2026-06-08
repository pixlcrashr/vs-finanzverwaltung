/* tslint:disable */

/**
 * UserSettings holds per-user application preferences.
 */
export interface V1UserSettings {

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
