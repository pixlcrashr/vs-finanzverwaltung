/* tslint:disable */
import { V1UpdateBudgetAccountValueRequest } from './v1update-budget-account-value-request';
export interface BudgetAccountValueServiceBatchUpdateBudgetAccountValuesBody {

  /**
   * The request messages specifying the resources to update.
   * A maximum of 1000 budget account values can be modified in a batch.
   */
  requests: Array<V1UpdateBudgetAccountValueRequest>;
}
