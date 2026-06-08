/* tslint:disable */

/**
 * ReportTemplate is a Handlebars template used to render reports.
 */
export interface V1ReportTemplate {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Human-readable name.
   */
  displayName: string;

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
  updateTime?: string;
}
