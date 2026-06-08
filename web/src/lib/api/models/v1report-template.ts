/* tslint:disable */

/**
 * ReportTemplate is a Handlebars template used to render reports.
 */
export interface V1ReportTemplate {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Human-readable name.
   */
  display_name: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * The Handlebars template content.
   */
  template: string;

  /**
   * The UUID of the report template.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
