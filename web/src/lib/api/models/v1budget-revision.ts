/* tslint:disable */
import { TypeDate } from './type-date';

/**
 * BudgetRevision is a read-only, point-in-time capture of a Budget's full set
 * of BudgetAccountValues. Revisions are immutable after creation and cannot be
 * rolled back to. The captured account values are accessible as a paginated
 * sub-collection via BudgetRevisionAccountValueService. See AIP-162.
 */
export interface V1BudgetRevision {
  budget?: string;

  /**
   * Timestamp when this revision was created.
   */
  create_time?: string;

  /**
   * The date this revision represents.
   */
  date?: TypeDate;

  /**
   * Optional free-text description for this revision.
   */
  display_description?: string;

  /**
   * Human-readable name for this revision.
   */
  display_name: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * The UUID of the revision.
   */
  uid?: string;
}
