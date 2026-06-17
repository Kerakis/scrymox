import { test, expect } from 'vitest';
import { getStoredTheme, setStoredTheme, resolveTheme, applyTheme } from './theme.js';

const makeStore = () => {
	/** @type {Map<string, string>} */
	const map = new Map();
	return {
		getItem: (/** @type {string} */ k) => map.get(k) ?? null,
		setItem: (/** @type {string} */ k, /** @type {string} */ v) => map.set(k, v)
	};
};

test('defaults to system and round-trips a stored choice', () => {
	const store = makeStore();
	expect(getStoredTheme(store)).toBe('system');
	setStoredTheme('dark', store);
	expect(getStoredTheme(store)).toBe('dark');
});

test('resolveTheme follows OS only when system', () => {
	expect(resolveTheme('system', true)).toBe('dark');
	expect(resolveTheme('system', false)).toBe('light');
	expect(resolveTheme('light', true)).toBe('light');
	expect(resolveTheme('dark', false)).toBe('dark');
});

test('applyTheme toggles the .dark class on the root element', () => {
	const root = {
		classList: {
			/** @type {Set<string>} */
			_set: new Set(),
			toggle(/** @type {string} */ c, /** @type {boolean} */ on) {
				on ? this._set.add(c) : this._set.delete(c);
			}
		}
	};
	applyTheme('dark', { documentElement: root });
	expect(root.classList._set.has('dark')).toBe(true);
	applyTheme('light', { documentElement: root });
	expect(root.classList._set.has('dark')).toBe(false);
});
