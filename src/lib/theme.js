/**
 * Theme resolution and persistence. Theme is 'light' | 'dark' | 'system'; the
 * resolved theme follows the OS only when 'system'. Dark mode is class-based
 * (a `.dark` class on <html>).
 *
 * @typedef {'light' | 'dark' | 'system'} Theme
 */
import { readString, writeString } from './storage.js';

export const THEME_KEY = 'scrymox:theme';

/** @param {any} [store] @returns {Theme} */
export const getStoredTheme = (store) =>
	/** @type {Theme} */ (readString(THEME_KEY, 'system', store));

/** @param {Theme} theme @param {any} [store] */
export const setStoredTheme = (theme, store) => writeString(THEME_KEY, theme, store);

/** @param {Theme} theme @param {boolean} prefersDark @returns {'light' | 'dark'} */
export const resolveTheme = (theme, prefersDark) =>
	theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

/** @param {'light' | 'dark'} resolved @param {{ documentElement: { classList: { toggle: (c: string, on: boolean) => void } } }} [doc] */
export const applyTheme = (resolved, doc = document) => {
	doc.documentElement.classList.toggle('dark', resolved === 'dark');
};
