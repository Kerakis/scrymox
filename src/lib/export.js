/**
 * Builders that turn the card list into the text/CSV payloads ScryMox exports.
 * Pure string functions — the actual download/clipboard side effects live in
 * the components.
 */

/** @typedef {import('../types').Card} Card */

/**
 * Builds the Moxfield bulk-edit text: one `count name (set) number marker`
 * line per card.
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
	'Price'
];

/** Wraps a value in quotes and escapes embedded quotes per RFC 4180. */
const csvQuote = (/** @type {string} */ value) => `"${value.replace(/"/g, '""')}"`;

/**
 * Resolves the price to export for a card: the manual override when set,
 * otherwise the auto price derived from the finish.
 * @param {Card} card
 * @returns {string}
 */
const exportPrice = (card) => {
	const value = card.priceManuallySet ? card.price : card.displayedPrice;
	return value == null ? '' : String(value);
};

/**
 * Builds a Moxfield-compatible CSV string for the card list.
 * @param {Card[]} cards
 * @returns {string}
 */
export const buildCsv = (cards) => {
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
			exportPrice(card)
		].join(',')
	);
	return [CSV_HEADER.join(','), ...rows].join('\n');
};
