/* tslint:disable */

/**
 * Report is a generated report instance produced from a ReportTemplate.
 * The rendered binary content is served exclusively via the Huma HTTP API
 * (GET /v1/organizations/{organization}/reports/{reportId}:download) and is intentionally excluded here.
 */
export interface V1Report {

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
   * UUID of the report template used to generate this report.
   */
  reportTemplateId: string;

  /**
   * The UUID of the report.
   */
  uid?: string;
}
