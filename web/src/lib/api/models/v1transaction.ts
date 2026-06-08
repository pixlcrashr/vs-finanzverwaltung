/* tslint:disable */
import { V1Decimal } from './v1decimal';

/**
 * Transaction represents a financial transaction between two transaction accounts.
 */
export interface V1Transaction {

  /**
   * Transaction amount.
   */
  amount: V1Decimal;

  /**
   * Booking date.
   */
  bookedAt: string;

  /**
   * Creation timestamp.
   */
  createTime?: string;

  /**
   * UUID of the credit transaction account.
   */
  creditTransactionAccountId: string;

  /**
   * UUID of the debit transaction account.
   */
  debitTransactionAccountId: string;

  /**
   * Human-readable transaction description.
   */
  description?: string;

  /**
   * Document date.
   */
  documentDate: string;

  /**
   * Optional document ID.
   */
  documentId?: string;

  /**
   * Entity tag for optimistic concurrency control.
   */
  etag?: string;
  name?: string;

  /**
   * External reference identifier.
   */
  reference?: string;

  /**
   * The UUID of the transaction.
   */
  uid?: string;

  /**
   * Last modification timestamp.
   */
  updateTime?: string;
}
