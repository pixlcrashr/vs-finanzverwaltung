/* tslint:disable */
import { V1ReportTemplate } from './v1report-template';
export interface V1ListReportTemplatesResponse {

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * The report templates returned.
   */
  report_templates?: Array<V1ReportTemplate>;

  /**
   * Total number of templates matching the filter (may be an estimate).
   */
  total_size?: string;
}
