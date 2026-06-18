/**
 * Price selection. Maps a price source + finish to the correct Scryfall price
 * key and resolves the value (or null when unavailable).
 *
 * @typedef {import('../types').CardPrices} CardPrices
 * @typedef {'tcgplayer' | 'cardmarket' | 'cardhoarder'} PriceSource
 */

/** Selectable price sources, in display order. */
export const PRICE_SOURCES = {
	tcgplayer: { label: 'TCGplayer', currency: 'USD' },
	cardmarket: { label: 'Cardmarket', currency: 'EUR' },
	cardhoarder: { label: 'Cardhoarder', currency: 'TIX' }
};

/**
 * @param {PriceSource} source
 * @param {string | null} finish '' | 'foil' | 'etched' | null
 * @returns {keyof CardPrices}
 */
export const priceKey = (source, finish) => {
	if (source === 'cardhoarder') return 'tix';
	const base = source === 'cardmarket' ? 'eur' : 'usd';
	if (finish === 'foil') return /** @type {keyof CardPrices} */ (`${base}_foil`);
	if (finish === 'etched') return /** @type {keyof CardPrices} */ (`${base}_etched`);
	return /** @type {keyof CardPrices} */ (base);
};

/**
 * @param {CardPrices | undefined} prices
 * @param {PriceSource} source
 * @param {string | null} finish
 * @returns {string | null}
 */
export const getPrice = (prices, source, finish) => {
	if (!prices) return null;
	return prices[priceKey(source, finish)] ?? null;
};

/** Currency display symbols, keyed by source. */
const CURRENCY = {
	tcgplayer: { symbol: '$', suffix: '' },
	cardmarket: { symbol: '€', suffix: '' },
	cardhoarder: { symbol: '', suffix: ' tix' }
};

/**
 * Formats a price value for display with the source's currency symbol.
 * Returns null when there is no value (callers render a placeholder).
 * @param {string | number | null | undefined} value
 * @param {PriceSource} source
 * @returns {string | null}
 */
export const formatPrice = (value, source) => {
	if (value == null || value === '') return null;
	const { symbol, suffix } = CURRENCY[source];
	return `${symbol}${value}${suffix}`;
};

/**
 * Currency affixes for a bare numeric input: a leading symbol ($/€) and/or a
 * trailing label (tix).
 * @param {PriceSource} source
 * @returns {{ symbol: string, suffix: string }}
 */
export const currencyAffix = (source) => ({
	symbol: CURRENCY[source].symbol,
	suffix: CURRENCY[source].suffix.trim()
});
