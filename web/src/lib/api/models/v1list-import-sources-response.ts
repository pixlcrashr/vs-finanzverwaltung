/* tslint:disable */
import { V1ImportSource } from './v1import-source';
export interface V1ListImportSourcesResponse {

  /**
   * The import sources returned.
   */
  importSources?: Array<V1ImportSource>;

  /**
   * A token to retrieve the next page of results.
   */
  nextPageToken?: string;

  /**
   * Total number of import sources matching the filter (may be an estimate).
   */
  totalSize?: string;
}
