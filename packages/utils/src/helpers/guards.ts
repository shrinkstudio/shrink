import type { Entry, FormField } from '../types';

export const isString = (value: unknown): value is string => typeof value === 'string';
export const isNumber = (value: unknown): value is number => typeof value === 'number';
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
export const isUndefined = (value: unknown): value is undefined => value === undefined;
export const isDate = (value: unknown): value is Date => value instanceof Date;

/**
 * It literally does nothing.
 */
export const noop = () => {
  // No operation.
};

/**
 * Makes sure a value is not `null` or `undefined`.
 * Useful for type safety when filtering empty elements from an array. Check out the example for more in-depth explanation.
 * @param value The value to type-check.
 * @example ```typescript
 * const items = [1, null, 4, undefined, 8];
 *
 * const filteredItemsError: number[] = items.filter((item) => value !== undefined && value !== null); // Type '(number | null | undefined)[]' is not assignable to type 'number[]'.
 *
 * const filteredItemsSuccess: number[] = items.filter(isNotEmpty); // Success!
 * ```
 */
export const isNotEmpty = <T>(value: T | null | undefined): value is T => value !== undefined && value !== null;

/**
 * Check if a key is included in a readonly array
 * @param key
 * @param source readonly array of strings
 * @returns True/false
 */
export const isKeyOf = <T extends string>(
  key: string | null | undefined,
  source: readonly T[]
): key is (typeof source)[number] => !!key && source.includes(<T>key);

/**
 * Gets the keys of an object with inferred typing.
 * @param object
 * @returns
 */
export const getObjectKeys = <T extends Record<string, unknown>>(object: T): (keyof T)[] =>
  Object.keys(object) as (keyof T)[];

/**
 * Gets type safe `Object.entries()`.
 * @param object
 */
export const getObjectEntries = <T extends Readonly<Record<string, unknown>>>(object: T): Entry<T>[] =>
  Object.entries(object) as Entry<T>[];

/**
 * @returns `true` if the target is an instance of Element type.
 * @param target
 */
export const isElement = (target: unknown): target is Element => target instanceof Element;

/**
 * @returns `true` if the target is an instance of HTMLElement type.
 * @param target
 */
export const isHTMLElement = (target: unknown): target is HTMLElement => target instanceof HTMLElement;

/**
 * @returns `true` if the target is an instance of HTMLVideoElement type.
 * @param target
 */
export const isHTMLVideoElement = (target: unknown): target is HTMLVideoElement => target instanceof HTMLVideoElement;

/**
 * @returns `true` if the target is an instance of HTMLInputElement type.
 * @param target
 */
export const isHTMLInputElement = (target: unknown): target is HTMLInputElement => target instanceof HTMLInputElement;

/**
 * @returns `true` if the target is an instance of HTMLSelectElement type.
 * @param target
 */
export const isHTMLSelectElement = (target: unknown): target is HTMLSelectElement =>
  target instanceof HTMLSelectElement;

/**
 * @returns `true` if the target is an instance of HTMLTextAreaElement type.
 * @param target
 */
export const isHTMLTextAreaElement = (target: unknown): target is HTMLTextAreaElement =>
  target instanceof HTMLTextAreaElement;

/**
 * Checks if an element is a form field element
 * @param element
 */
export const isFormField = (element: Element | EventTarget | null): element is FormField =>
  isHTMLInputElement(element) || isHTMLSelectElement(element) || isHTMLTextAreaElement(element);

/**
 * Checks if an element is a form element
 * @param target
 */
export const isHTMLFormElement = (target: unknown): target is HTMLFormElement => target instanceof HTMLFormElement;

/**
 * @returns `true` if the target is an instance of HTMLAnchorElement type.
 * @param target
 */
export const isHTMLAnchorElement = (target: unknown): target is HTMLAnchorElement =>
  target instanceof HTMLAnchorElement;

/**
 * @returns `true` if the target is an instance of HTMLOptionElement type.
 * @param target
 */
export const isHTMLOptionElement = (target: unknown): target is HTMLOptionElement =>
  target instanceof HTMLOptionElement;

/**
 * @returns `true` if the target is an instance of HTMLImageElement type.
 * @param target
 */
export const isHTMLImageElement = (target: unknown): target is HTMLImageElement => target instanceof HTMLImageElement;

/**
 * @returns `true` if the target is an instance of HTMLButtonElement type.
 * @param target
 */
export const isHTMLButtonElement = (target: unknown): target is HTMLButtonElement =>
  target instanceof HTMLButtonElement;

/**
 * @returns `true` if the target is an instance of File type.
 * @param target
 */
export const isFile = (target: unknown): target is File => target instanceof File;
