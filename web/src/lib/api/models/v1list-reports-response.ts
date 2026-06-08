/* tslint:disable */
import { V1Report } from './v1report';
export interface V1ListReportsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * The reports returned.
   */
  reports?: Array<V1Report>;

  /**
   * Total number of reports matching the filter (may be an estimate).
   */
  totalSize?: string;
}
