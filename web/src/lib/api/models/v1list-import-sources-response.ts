/* tslint:disable */
import { V1ImportSource } from './v1import-source';
export interface V1ListImportSourcesResponse {

  /**
   * The import sources returned.
   */
  import_sources?: Array<V1ImportSource>;

  /**
   * A token to retrieve the next page of results.
   */
  next_page_token?: string;

  /**
   * Total number of import sources matching the filter (may be an estimate).
   */
  total_size?: string;
}
