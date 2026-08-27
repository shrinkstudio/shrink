/**
 * Defines a typed object entry
 */
export type Entry<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

/**
 * Converts a `Map<K, V>` type to its equivalent when performing `[...map.entries()]`.
 * @example ```typescript
 * const map: MapType = new Map(['key', 'value']);
 * const entries = [...map.entries()]; // Same type as MapEntries<MapType>
 *
 * typeof entries === MapEntries<MapType>
 * ```
 */
export type MapEntries<MapToConvert> = MapToConvert extends Map<infer Key, infer Value> ? [Key, Value][] : never;

/**
 * Makes a loose autocomplete string type.
 */
export type LooseString<T extends string> = T | Omit<string, T>;
