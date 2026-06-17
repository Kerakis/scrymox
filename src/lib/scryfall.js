import { getDefaultFinish, getDisplayFinish, getFinishPrice } from './finishes.js';

const SEARCH_ENDPOINT = 'https://api.scryfall.com/cards/search';

/** Minimum gap between requests, per Scryfall's rate-limit guidance. */
const MIN_REQUEST_INTERVAL_MS = 100;

/**
 * The slice of `fetch` that {@link searchAllPages} needs — loose enough that a
 * stub can be injected in tests, while the real `fetch` still satisfies it.
 * @typedef {(
 *   url: string,
 *   init?: { headers?: Record<string, string> }
 * ) => Promise<{ json: () => Promise<unknown> }>} FetchLike
 */

const defaultSleep = (/** @type {number} */ ms) =>
	new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Builds a Scryfall `/cards/search` URL from the user's query plus any saved
 * default options.
 * @param {string} query
 * @param {string} defaultOptions
 * @returns {string}
 */
export const buildSearchUrl = (query, defaultOptions) => {
	const combined = [query, defaultOptions]
		.map((part) => part.trim())
		.filter(Boolean)
		.join(' ');
	return `${SEARCH_ENDPOINT}?q=${encodeURIComponent(combined)}`;
};

/**
 * Converts a raw Scryfall card into ScryMox's editable {@link Card} model,
 * applying default finish/price and per-card defaults.
 * @param {import('../types').ScryfallCard} scryfallCard
 * @returns {import('../types').Card}
 */
export const normalizeCard = (scryfallCard) => {
	const selectedFinish = getDefaultFinish(scryfallCard.finishes);
	const faces = scryfallCard.card_faces;

	/** @type {import('../types').Card['image_uris']} */
	let image_uris;
	let name = scryfallCard.name;

	if (!faces) {
		image_uris = scryfallCard.image_uris;
	} else if (scryfallCard.layout !== 'split' && scryfallCard.layout !== 'flip') {
		image_uris = [faces[0]?.image_uris, faces[1]?.image_uris];
		if (scryfallCard.layout === 'reversible_card' && faces.length) {
			name = faces[0].name;
		}
	} else {
		image_uris = scryfallCard.image_uris ?? faces[0]?.image_uris;
	}

	return {
		id: scryfallCard.id,
		collector_number: scryfallCard.collector_number,
		set: scryfallCard.set,
		image_uris,
		name,
		finishes: scryfallCard.finishes,
		selectedFinish,
		displayFinish: getDisplayFinish(selectedFinish),
		count: 1,
		condition: 'NM',
		language: 'EN',
		alter: false,
		proxy: false,
		prices: scryfallCard.prices,
		displayedPrice: getFinishPrice(scryfallCard.prices, selectedFinish),
		priceManuallySet: false
	};
};

/**
 * Fetches every page of a Scryfall search, normalizing and reporting each page
 * as it arrives (so callers can render incrementally). Requests are throttled
 * to stay within Scryfall's rate limit.
 *
 * @param {string} url - The first page URL (from {@link buildSearchUrl}).
 * @param {{
 *   onPage: (cards: import('../types').Card[], totalCards: number) => void;
 *   fetchImpl?: FetchLike;
 *   sleep?: (ms: number) => Promise<void>;
 * }} options
 * @returns {Promise<{ error?: string }>} An error message if the search failed.
 */
export const searchAllPages = async (url, { onPage, fetchImpl = fetch, sleep = defaultSleep }) => {
	/** @type {string | null} */
	let next = url;
	let lastRequest = 0;

	while (next) {
		const wait = MIN_REQUEST_INTERVAL_MS - (Date.now() - lastRequest);
		if (wait > 0) await sleep(wait);
		lastRequest = Date.now();

		const response = await fetchImpl(next, { headers: { 'User-Agent': 'Scrymox' } });
		const data = /** @type {import('../types').ScryfallSearchResponse} */ (await response.json());

		if (data.object === 'error' || data.warnings) {
			let error = data.details ?? '';
			if (data.warnings) error += (error ? ' ' : '') + data.warnings.join(' ');
			return { error };
		}

		onPage(data.data.map(normalizeCard), data.total_cards);
		next = data.has_more ? data.next_page : null;
	}

	return {};
};
