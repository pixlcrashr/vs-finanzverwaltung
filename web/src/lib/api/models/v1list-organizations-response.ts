/* tslint:disable */
import { V1Organization } from './v1organization';
export interface V1ListOrganizationsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * The organizations returned.
   */
  organizations?: Array<V1Organization>;

  /**
   * Total number of organizations matching the filter (may be an estimate).
   */
  totalSize?: string;
}
