/* tslint:disable */
import { V1BudgetActualAccountValue } from './v1budget-actual-account-value';
export interface V1BatchGetBudgetActualAccountValuesResponse {

  /**
   * The actual account values returned, in the same order as the names in the
   * request. Values with a computed amount of zero or less are omitted.
   */
  actual_account_values?: Array<V1BudgetActualAccountValue>;
}
