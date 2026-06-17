/**
 * Finish helpers shared across the app.
 *
 * A "finish" is one of '' (nonfoil), 'foil', or 'etched'. Moxfield expects a
 * trailing marker in bulk/CSV exports, mapped here.
 */

/** Maps a finish to the marker Moxfield expects in exports. */
const FINISH_MARKERS = {
	foil: '*F*',
	etched: '*E*'
};

/**
 * Picks a sensible default finish for a card given its available finishes,
 * preferring nonfoil.
 * @param {string[]} finishes
 * @returns {'' | 'foil' | 'etched' | null}
 */
export const getDefaultFinish = (finishes) => {
	if (finishes.includes('nonfoil')) return '';
	if (finishes.includes('foil')) return 'foil';
	if (finishes.includes('etched')) return 'etched';
	return null;
};

/**
 * Maps a selected finish to its Moxfield export marker.
 * @param {string | null} selectedFinish
 * @returns {string} '', '*F*', or '*E*'
 */
export const getDisplayFinish = (selectedFinish) => {
	if (selectedFinish == null) return '';
	return FINISH_MARKERS[/** @type {keyof typeof FINISH_MARKERS} */ (selectedFinish)] ?? '';
};

/**
 * Returns the price string for a given finish, or null when unavailable.
 * @param {import('../types').CardPrices | undefined} prices
 * @param {string | null} selectedFinish
 * @returns {string | null}
 */
export const getFinishPrice = (prices, selectedFinish) => {
	if (!prices) return null;
	if (selectedFinish === 'foil') return prices.usd_foil ?? null;
	if (selectedFinish === 'etched') return prices.usd_etched ?? null;
	return prices.usd ?? null;
};

/**
 * True when `finish` is offered by the card's `finishes`. '' maps to 'nonfoil'.
 * @param {string[]} finishes
 * @param {string | null} finish
 * @returns {boolean}
 */
export const isFinishAllowed = (finishes, finish) => {
	if (finish === '') return finishes.includes('nonfoil');
	if (finish === 'foil') return finishes.includes('foil');
	if (finish === 'etched') return finishes.includes('etched');
	return false;
};
