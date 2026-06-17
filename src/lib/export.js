/**
 * Builders that turn the card list into the text/CSV payloads ScryMox exports.
 * Pure string functions — the download/clipboard side effects live in the
 * components.
 */
import { getPrice } from './prices.js';

/** @typedef {import('../types').Card} Card */

/**
 * Builds the Moxfield bulk-edit text: one `count name (set) number marker` line
 * per card.
 * @param {Card[]} cards
 * @returns {string}
 */
export const buildBulkText = (cards) =>
	cards
		.map((card) =>
			`${card.count} ${card.name} (${card.set}) ${card.collector_number} ${card.displayFinish}`.trimEnd()
		)
		.join('\n');

const CSV_HEADER = [
	'Count',
	'Name',
	'Edition',
	'Collector Number',
	'Condition',
	'Language',
	'Foil',
	'Alter',
	'Proxy',
	'Price',
	'Scryfall ID'
];

/** Wraps a value in quotes and escapes embedded quotes per RFC 4180. */
const csvQuote = (/** @type {string} */ value) => `"${value.replace(/"/g, '""')}"`;

/**
 * Price to export: the manual override when set, otherwise the value for the
 * chosen source + finish; blank when unavailable.
 * @param {Card} card
 * @param {import('./prices').PriceSource} source
 * @returns {string}
 */
const exportPrice = (card, source) => {
	const value = card.priceManuallySet
		? card.price
		: getPrice(card.prices, source, card.selectedFinish);
	return value == null ? '' : String(value);
};

/**
 * Builds a Moxfield-compatible CSV string for the card list.
 * @param {Card[]} cards
 * @param {import('./prices').PriceSource} [source]
 * @returns {string}
 */
export const buildCsv = (cards, source = 'tcgplayer') => {
	const rows = cards.map((card) =>
		[
			card.count,
			csvQuote(card.name),
			card.set.toUpperCase(),
			card.collector_number,
			card.condition,
			card.language,
			card.selectedFinish === 'foil' || card.selectedFinish === 'etched' ? card.selectedFinish : '',
			card.alter ? 'Yes' : '',
			card.proxy ? 'Yes' : '',
			exportPrice(card, source),
			card.id
		].join(',')
	);
	return [CSV_HEADER.join(','), ...rows].join('\n');
};
