/* tslint:disable */
import { V1ReportTemplate } from './v1report-template';
export interface V1ListReportTemplatesResponse {

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * The report templates returned.
   */
  reportTemplates?: Array<V1ReportTemplate>;

  /**
   * Total number of templates matching the filter (may be an estimate).
   */
  totalSize?: string;
}
