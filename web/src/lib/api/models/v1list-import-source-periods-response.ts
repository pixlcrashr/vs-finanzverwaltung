/* tslint:disable */
import { V1ImportSourcePeriod } from './v1import-source-period';
export interface V1ListImportSourcePeriodsResponse {

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * The periods returned.
   */
  periods?: Array<V1ImportSourcePeriod>;

  /**
   * Total number of periods matching the filter (may be an estimate).
   */
  total_size?: string;
}
