import { isDate } from './guards';

/**
 * Converts a string to a `Date`.
 * @param value
 * @returns The `Date` object, if the conversion is successful.
 */
export const normalizeDate = (value: string | number | Date) => {
  if (isDate(value)) return value;
  if (value === '') return;

  const date = new Date(value);

  if (!isNaN(date.getTime())) {
    return date;
  }
};
