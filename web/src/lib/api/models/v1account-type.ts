/* tslint:disable */

/**
 * AccountType defines the classification of a ledger account for transaction interpretation.
 *
 *  - ACCOUNT_TYPE_UNSPECIFIED: Default value. Not specified.
 *  - ACCOUNT_TYPE_ASSET: Asset account (e.g., bank accounts, receivables).
 *  - ACCOUNT_TYPE_LIABILITY: Liability account (e.g., loans, payables).
 *  - ACCOUNT_TYPE_EQUITY: Equity account (e.g., capital, retained earnings). Treated as LIABILITY for calculations.
 *  - ACCOUNT_TYPE_REVENUE: Revenue account (e.g., sales, interest income).
 *  - ACCOUNT_TYPE_EXPENSE: Expense account (e.g., rent, salaries, utilities).
 *  - ACCOUNT_TYPE_SYSTEM: System account for internal calculations. Special internal use only.
 */
type V1AccountType =
  'ACCOUNT_TYPE_UNSPECIFIED' |
  'ACCOUNT_TYPE_ASSET' |
  'ACCOUNT_TYPE_LIABILITY' |
  'ACCOUNT_TYPE_EQUITY' |
  'ACCOUNT_TYPE_REVENUE' |
  'ACCOUNT_TYPE_EXPENSE' |
  'ACCOUNT_TYPE_SYSTEM';
module V1AccountType {
  export const ACCOUNT_TYPE_UNSPECIFIED: V1AccountType = 'ACCOUNT_TYPE_UNSPECIFIED';
  export const ACCOUNT_TYPE_ASSET: V1AccountType = 'ACCOUNT_TYPE_ASSET';
  export const ACCOUNT_TYPE_LIABILITY: V1AccountType = 'ACCOUNT_TYPE_LIABILITY';
  export const ACCOUNT_TYPE_EQUITY: V1AccountType = 'ACCOUNT_TYPE_EQUITY';
  export const ACCOUNT_TYPE_REVENUE: V1AccountType = 'ACCOUNT_TYPE_REVENUE';
  export const ACCOUNT_TYPE_EXPENSE: V1AccountType = 'ACCOUNT_TYPE_EXPENSE';
  export const ACCOUNT_TYPE_SYSTEM: V1AccountType = 'ACCOUNT_TYPE_SYSTEM';
  export function values(): V1AccountType[] {
    return [
      ACCOUNT_TYPE_UNSPECIFIED,
      ACCOUNT_TYPE_ASSET,
      ACCOUNT_TYPE_LIABILITY,
      ACCOUNT_TYPE_EQUITY,
      ACCOUNT_TYPE_REVENUE,
      ACCOUNT_TYPE_EXPENSE,
      ACCOUNT_TYPE_SYSTEM
    ];
  }
}

export { V1AccountType }