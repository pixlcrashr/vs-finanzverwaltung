/* tslint:disable */
import { TypeDate } from './type-date';

/**
 * ImportSource represents an external data source from which transactions are imported.
 */
export interface V1ImportSource {

  /**
   * Creation timestamp.
   */
  create_time?: string;

  /**
   * Optional free-text description.
   */
  display_description?: string;

  /**
   * Human-readable import source name.
   */
  display_name: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * Period start date for this import source.
   */
  period_start: TypeDate;

  /**
   * The UUID of the import source.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  update_time?: string;
}
