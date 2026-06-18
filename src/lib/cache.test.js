import { test, expect } from 'vitest';
import {
	readCache,
	writeCache,
	invalidateCache,
	normalizeQueryKey,
	CACHE_TTL_MS
} from './cache.js';

const makeStore = () => {
	/** @type {Map<string, string>} */
	const map = new Map();
	return {
		map,
		getItem: (/** @type {string} */ k) => map.get(k) ?? null,
		setItem: (/** @type {string} */ k, /** @type {string} */ v) => map.set(k, v),
		removeItem: (/** @type {string} */ k) => map.delete(k)
	};
};

test('normalizeQueryKey collapses whitespace and case', () => {
	expect(normalizeQueryKey('  Set:DSK   Type:Legendary ')).toBe('set:dsk type:legendary');
});

test('writeCache then readCache returns the entry within TTL', () => {
	const store = makeStore();
	writeCache('set:dsk', [{ id: 'a' }], 1, { now: () => 1000, store });
	expect(readCache('SET:DSK', { now: () => 1000 + CACHE_TTL_MS - 1, store })).toEqual({
		cards: [{ id: 'a' }],
		totalCards: 1
	});
});

test('readCache returns null once the entry is older than the TTL', () => {
	const store = makeStore();
	writeCache('q', [{ id: 'a' }], 1, { now: () => 0, store });
	expect(readCache('q', { now: () => CACHE_TTL_MS + 1, store })).toBeNull();
});

test('invalidateCache removes the entry', () => {
	const store = makeStore();
	writeCache('q', [{ id: 'a' }], 1, { now: () => 0, store });
	invalidateCache('q', { store });
	expect(readCache('q', { now: () => 0, store })).toBeNull();
});
