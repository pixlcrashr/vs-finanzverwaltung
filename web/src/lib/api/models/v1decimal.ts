/* tslint:disable */

/**
 * Decimal represents an arbitrary-precision decimal number, suitable for
 * monetary and other values where floating-point rounding is unacceptable.
 *
 * The value is a formatted decimal string, e.g. "1234.56", "-42", "0.001".
 */
export interface V1Decimal {

  /**
   * The decimal number as a formatted string (e.g. "1234.56", "-42", "0.001").
   */
  value?: string;
}
