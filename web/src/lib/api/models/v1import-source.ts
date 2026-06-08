/* tslint:disable */
import { TypeDate } from './type-date';

/**
 * ImportSource represents an external data source from which transactions are imported.
 */
export interface V1ImportSource {

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * Optional free-text description.
   */
  displayDescription?: string;

  /**
   * Human-readable import source name.
   */
  displayName: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * Period start date for this import source.
   */
  periodStart: TypeDate;

  /**
   * The UUID of the import source.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
