import { describe, it, expect, beforeEach } from 'vitest';
import { readJSON, writeJSON, readString, writeString, removeKey } from './storage.js';

/** Minimal in-memory localStorage stand-in. */
const makeStore = (/** @type {Record<string, string>} */ seed = {}) => {
	/** @type {Record<string, string>} */
	const data = { ...seed };
	return {
		getItem: (/** @type {string} */ k) => (k in data ? data[k] : null),
		setItem: (/** @type {string} */ k, /** @type {string} */ v) => {
			data[k] = v;
		}
	};
};

/** @type {ReturnType<typeof makeStore>} */
let store;
beforeEach(() => {
	store = makeStore();
});

describe('readJSON / writeJSON', () => {
	it('round-trips a value', () => {
		writeJSON('history', ['a', 'b'], store);
		expect(readJSON('history', [], store)).toEqual(['a', 'b']);
	});

	it('returns the fallback for a missing key', () => {
		expect(readJSON('missing', ['default'], store)).toEqual(['default']);
	});

	it('returns the fallback for invalid JSON', () => {
		const bad = makeStore({ history: 'not json{' });
		expect(readJSON('history', [], bad)).toEqual([]);
	});
});

describe('readString / writeString', () => {
	it('round-trips a string', () => {
		writeString('tab', 'CSV', store);
		expect(readString('tab', 'Bulk Edit', store)).toBe('CSV');
	});

	it('returns the fallback for a missing key', () => {
		expect(readString('tab', 'Bulk Edit', store)).toBe('Bulk Edit');
	});
});

describe('removeKey', () => {
	it('deletes a stored value', () => {
		/** @type {Map<string, string>} */
		const map = new Map([['k', 'v']]);
		const removable = {
			getItem: (/** @type {string} */ k) => map.get(k) ?? null,
			setItem: (/** @type {string} */ k, /** @type {string} */ v) => map.set(k, v),
			removeItem: (/** @type {string} */ k) => map.delete(k)
		};
		removeKey('k', removable);
		expect(readString('k', 'fallback', removable)).toBe('fallback');
	});
});
