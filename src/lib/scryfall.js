import { getDefaultFinish, getDisplayFinish, getFinishPrice } from './finishes.js';
import { requestQueue } from './requestQueue.js';

const SEARCH_ENDPOINT = 'https://api.scryfall.com/cards/search';
const ACCEPT = 'application/json;q=0.9,*/*;q=0.8';

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
 * Converts a raw Scryfall card into ScryMox's editable {@link Card} model.
 * @param {import('../types').ScryfallCard} scryfallCard
 * @param {import('./prices').PriceSource} [source]
 * @returns {import('../types').Card}
 */
export const normalizeCard = (scryfallCard, source = 'tcgplayer') => {
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
		oracle_id: scryfallCard.oracle_id,
		collector_number: scryfallCard.collector_number,
		set: scryfallCard.set,
		set_name: scryfallCard.set_name,
		layout: scryfallCard.layout,
		games: scryfallCard.games ?? [],
		image_uris,
		name,
		finishes: scryfallCard.finishes,
		selectedFinish,
		displayFinish: getDisplayFinish(selectedFinish),
		count: 1,
		condition: 'NM',
		language: (scryfallCard.lang ?? 'en').toUpperCase(),
		alter: false,
		proxy: false,
		prices: scryfallCard.prices,
		// Transitional: kept so existing components keep rendering until Plan 02
		// switches them to live getPrice(prices, source, finish).
		displayedPrice: getFinishPrice(scryfallCard.prices, selectedFinish),
		priceManuallySet: false
	};
};

/**
 * Fetches every page of a Scryfall search, normalizing and reporting each page
 * as it arrives. All requests go through the shared queue (throttle + 429
 * backoff).
 *
 * @param {string} url
 * @param {{
 *   onPage: (cards: import('../types').Card[], totalCards: number) => void;
 *   source?: import('./prices').PriceSource;
 *   enqueue?: (url: string, init?: RequestInit) => Promise<{ json: () => Promise<any> }>;
 * }} options
 * @returns {Promise<{ error?: string }>}
 */
export const searchAllPages = async (
	url,
	{ onPage, source = 'tcgplayer', enqueue = requestQueue.enqueue }
) => {
	/** @type {string | null} */
	let next = url;

	while (next) {
		const response = await enqueue(next, { headers: { Accept: ACCEPT } });
		const data = /** @type {import('../types').ScryfallSearchResponse} */ (await response.json());

		if (data.object === 'error' || data.warnings) {
			let error = data.details ?? '';
			if (data.warnings) error += (error ? ' ' : '') + data.warnings.join(' ');
			return { error };
		}

		onPage(
			data.data.map((card) => normalizeCard(card, source)),
			data.total_cards
		);
		next = data.has_more ? data.next_page : null;
	}

	return {};
};
