/**
 * Thin, typed wrappers around localStorage. The backing store is injectable so
 * the helpers can be unit-tested without a browser.
 *
 * @typedef {Pick<Storage, 'getItem' | 'setItem'>} KeyValueStore
 */

/** @type {KeyValueStore | undefined} */
const defaultStore = typeof localStorage !== 'undefined' ? localStorage : undefined;

/**
 * Reads and parses a JSON value, returning `fallback` if it is missing or
 * cannot be parsed.
 * @template T
 * @param {string} key
 * @param {T} fallback
 * @param {KeyValueStore | undefined} [store]
 * @returns {T}
 */
export const readJSON = (key, fallback, store = defaultStore) => {
	const raw = store?.getItem(key);
	if (raw == null) return fallback;
	try {
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
};

/**
 * Serialises and stores a JSON value.
 * @param {string} key
 * @param {unknown} value
 * @param {KeyValueStore | undefined} [store]
 */
export const writeJSON = (key, value, store = defaultStore) => {
	store?.setItem(key, JSON.stringify(value));
};

/**
 * Reads a string value, returning `fallback` if it is missing.
 * @param {string} key
 * @param {string} fallback
 * @param {KeyValueStore | undefined} [store]
 * @returns {string}
 */
export const readString = (key, fallback, store = defaultStore) => {
	return store?.getItem(key) ?? fallback;
};

/**
 * Stores a string value.
 * @param {string} key
 * @param {string} value
 * @param {KeyValueStore | undefined} [store]
 */
export const writeString = (key, value, store = defaultStore) => {
	store?.setItem(key, value);
};
