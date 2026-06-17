import { test, expect } from 'vitest';
import { priceKey, getPrice, PRICE_SOURCES } from './prices.js';

test('priceKey maps source + finish to the Scryfall key', () => {
	expect(priceKey('tcgplayer', '')).toBe('usd');
	expect(priceKey('tcgplayer', 'foil')).toBe('usd_foil');
	expect(priceKey('tcgplayer', 'etched')).toBe('usd_etched');
	expect(priceKey('cardmarket', 'foil')).toBe('eur_foil');
	expect(priceKey('cardmarket', 'etched')).toBe('eur_etched');
	expect(priceKey('cardhoarder', 'foil')).toBe('tix');
});

test('getPrice returns the value or null when missing', () => {
	const prices = { usd: '3.41', usd_foil: null, tix: '0.02' };
	expect(getPrice(prices, 'tcgplayer', '')).toBe('3.41');
	expect(getPrice(prices, 'tcgplayer', 'foil')).toBeNull();
	expect(getPrice(prices, 'cardhoarder', '')).toBe('0.02');
	expect(getPrice(undefined, 'tcgplayer', '')).toBeNull();
});

test('PRICE_SOURCES lists the three affiliates', () => {
	expect(Object.keys(PRICE_SOURCES)).toEqual(['tcgplayer', 'cardmarket', 'cardhoarder']);
});
