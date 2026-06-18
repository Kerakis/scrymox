/**
 * localStorage-backed Scryfall query cache. Entries are keyed by the normalized
 * query string and expire after 24h (Scryfall updates prices at most daily), so
 * repeat searches do not hit the API.
 */
import { readJSON, writeJSON, removeKey } from './storage.js';

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
// v2: card normalization shape changed (DFC images); drop pre-fix cached cards.
const KEY_PREFIX = 'scrymox:cache:v2:';

/** @param {string} query */
export const normalizeQueryKey = (query) => query.trim().replace(/\s+/g, ' ').toLowerCase();

const keyFor = (/** @type {string} */ query) => KEY_PREFIX + normalizeQueryKey(query);

/**
 * @param {string} query
 * @param {{ now?: () => number, store?: any }} [opts]
 * @returns {{ cards: any[], totalCards: number } | null}
 */
export const readCache = (query, { now = Date.now, store } = {}) => {
	const entry = /** @type {{ savedAt: number, cards: any[], totalCards: number } | null} */ (
		readJSON(keyFor(query), null, store)
	);
	if (!entry || typeof entry.savedAt !== 'number') return null;
	if (now() - entry.savedAt > CACHE_TTL_MS) return null;
	return { cards: entry.cards, totalCards: entry.totalCards };
};

/**
 * @param {string} query
 * @param {any[]} cards
 * @param {number} totalCards
 * @param {{ now?: () => number, store?: any }} [opts]
 */
export const writeCache = (query, cards, totalCards, { now = Date.now, store } = {}) => {
	writeJSON(keyFor(query), { savedAt: now(), cards, totalCards }, store);
};

/**
 * @param {string} query
 * @param {{ store?: any }} [opts]
 */
export const invalidateCache = (query, { store } = {}) => {
	removeKey(keyFor(query), store);
};
