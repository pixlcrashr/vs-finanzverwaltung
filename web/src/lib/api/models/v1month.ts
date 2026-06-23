/* tslint:disable */
type V1Month =
  'MONTH_UNSPECIFIED' |
  'MONTH_JANUARY' |
  'MONTH_FEBRUARY' |
  'MONTH_MARCH' |
  'MONTH_APRIL' |
  'MONTH_MAY' |
  'MONTH_JUNE' |
  'MONTH_JULY' |
  'MONTH_AUGUST' |
  'MONTH_SEPTEMBER' |
  'MONTH_OCTOBER' |
  'MONTH_NOVEMBER' |
  'MONTH_DECEMBER';
module V1Month {
  export const MONTH_UNSPECIFIED: V1Month = 'MONTH_UNSPECIFIED';
  export const MONTH_JANUARY: V1Month = 'MONTH_JANUARY';
  export const MONTH_FEBRUARY: V1Month = 'MONTH_FEBRUARY';
  export const MONTH_MARCH: V1Month = 'MONTH_MARCH';
  export const MONTH_APRIL: V1Month = 'MONTH_APRIL';
  export const MONTH_MAY: V1Month = 'MONTH_MAY';
  export const MONTH_JUNE: V1Month = 'MONTH_JUNE';
  export const MONTH_JULY: V1Month = 'MONTH_JULY';
  export const MONTH_AUGUST: V1Month = 'MONTH_AUGUST';
  export const MONTH_SEPTEMBER: V1Month = 'MONTH_SEPTEMBER';
  export const MONTH_OCTOBER: V1Month = 'MONTH_OCTOBER';
  export const MONTH_NOVEMBER: V1Month = 'MONTH_NOVEMBER';
  export const MONTH_DECEMBER: V1Month = 'MONTH_DECEMBER';
  export function values(): V1Month[] {
    return [
      MONTH_UNSPECIFIED,
      MONTH_JANUARY,
      MONTH_FEBRUARY,
      MONTH_MARCH,
      MONTH_APRIL,
      MONTH_MAY,
      MONTH_JUNE,
      MONTH_JULY,
      MONTH_AUGUST,
      MONTH_SEPTEMBER,
      MONTH_OCTOBER,
      MONTH_NOVEMBER,
      MONTH_DECEMBER
    ];
  }
}

export { V1Month }