/* tslint:disable */
import { V1Report } from './v1report';
export interface V1ListReportsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * The reports returned.
   */
  reports?: Array<V1Report>;

  /**
   * Total number of reports matching the filter (may be an estimate).
   */
  total_size?: string;
}
