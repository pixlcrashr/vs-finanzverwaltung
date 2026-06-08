/* tslint:disable */

/**
 * * A full date, with non-zero year, month, and day values.
 * * A month and day, with a zero year (for example, an anniversary).
 * * A year on its own, with a zero month and a zero day.
 * * A year and month, with a zero day (for example, a credit card expiration
 *   date).
 *
 * Related types:
 *
 * * [google.type.TimeOfDay][google.type.TimeOfDay]
 * * [google.type.DateTime][google.type.DateTime]
 * * [google.protobuf.Timestamp][google.protobuf.Timestamp]
 */
export interface TypeDate {

  /**
   * Day of a month. Must be from 1 to 31 and valid for the year and month, or 0
   * to specify a year by itself or a year and month where the day isn't
   * significant.
   */
  day?: number;

  /**
   * Month of a year. Must be from 1 to 12, or 0 to specify a year without a
   * month and day.
   */
  month?: number;

  /**
   * Year of the date. Must be from 1 to 9999, or 0 to specify a date without
   * a year.
   */
  year?: number;
}
