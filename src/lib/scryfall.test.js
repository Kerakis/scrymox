import { describe, it, expect, vi } from 'vitest';
import { buildSearchUrl, normalizeCard, searchAllPages } from './scryfall.js';

describe('buildSearchUrl', () => {
	it('encodes the query against the Scryfall search endpoint', () => {
		expect(buildSearchUrl('lightning bolt', '')).toBe(
			'https://api.scryfall.com/cards/search?q=lightning%20bolt'
		);
	});

	it('appends default query options with a single space', () => {
		expect(buildSearchUrl('bolt', 'not:digital')).toBe(
			'https://api.scryfall.com/cards/search?q=bolt%20not%3Adigital'
		);
	});

	it('trims surrounding whitespace and ignores empty default options', () => {
		expect(buildSearchUrl('  bolt  ', '   ')).toBe('https://api.scryfall.com/cards/search?q=bolt');
	});
});

describe('normalizeCard', () => {
	const base = {
		id: 'abc',
		name: 'Lightning Bolt',
		set: 'lea',
		collector_number: '161',
		layout: 'normal',
		finishes: ['nonfoil'],
		image_uris: { border_crop: 'front.png' },
		prices: { usd: '1.00', usd_foil: '2.00', usd_etched: null }
	};

	it('copies the core fields and applies editable defaults', () => {
		const card = normalizeCard(base);
		expect(card).toMatchObject({
			id: 'abc',
			name: 'Lightning Bolt',
			set: 'lea',
			collector_number: '161',
			count: 1,
			condition: 'NM',
			language: 'EN',
			alter: false,
			proxy: false,
			priceManuallySet: false
		});
	});

	it('derives finish, marker, and price from the default finish', () => {
		const card = normalizeCard(base);
		expect(card.selectedFinish).toBe('');
		expect(card.displayFinish).toBe('');
		expect(card.displayedPrice).toBe('1.00');
	});

	it('defaults a foil-only card to foil and its foil price', () => {
		const card = normalizeCard({ ...base, finishes: ['foil'] });
		expect(card.selectedFinish).toBe('foil');
		expect(card.displayFinish).toBe('*F*');
		expect(card.displayedPrice).toBe('2.00');
	});

	it('keeps single image_uris for a single-faced card', () => {
		expect(normalizeCard(base).image_uris).toEqual({ border_crop: 'front.png' });
	});

	it('collects both faces for a transform card', () => {
		const card = normalizeCard({
			...base,
			image_uris: undefined,
			layout: 'transform',
			card_faces: [
				{ name: 'Front', image_uris: { border_crop: 'f.png' } },
				{ name: 'Back', image_uris: { border_crop: 'b.png' } }
			]
		});
		expect(card.image_uris).toEqual([{ border_crop: 'f.png' }, { border_crop: 'b.png' }]);
		expect(card.name).toBe('Lightning Bolt');
	});

	it('uses the first face name for reversible cards', () => {
		const card = normalizeCard({
			...base,
			image_uris: undefined,
			layout: 'reversible_card',
			card_faces: [
				{ name: 'Side A', image_uris: { border_crop: 'a.png' } },
				{ name: 'Side B', image_uris: { border_crop: 'b.png' } }
			]
		});
		expect(card.name).toBe('Side A');
	});

	it('keeps the single name and top-level image for split/flip cards', () => {
		const card = normalizeCard({
			...base,
			layout: 'split',
			card_faces: [
				{ name: 'Fire', image_uris: { border_crop: 'fire.png' } },
				{ name: 'Ice', image_uris: { border_crop: 'ice.png' } }
			]
		});
		expect(card.name).toBe('Lightning Bolt');
		expect(card.image_uris).toEqual({ border_crop: 'front.png' });
	});
});

describe('searchAllPages', () => {
	const scryfallCard = {
		id: '1',
		name: 'Lightning Bolt',
		set: 'lea',
		collector_number: '161',
		layout: 'normal',
		finishes: ['nonfoil'],
		image_uris: { border_crop: 'front.png' },
		prices: { usd: '1.00' }
	};

	/** Builds a fake fetch whose responses are keyed by URL. */
	const fakeFetch = (/** @type {Record<string, unknown>} */ responsesByUrl) =>
		vi.fn(async (/** @type {string} */ url) => ({ json: async () => responsesByUrl[url] }));

	const noSleep = vi.fn(async () => {});

	it('normalizes and reports a single page, returning no error', async () => {
		const onPage = vi.fn();
		const fetchImpl = fakeFetch({
			start: { object: 'list', total_cards: 1, has_more: false, data: [scryfallCard] }
		});

		const result = await searchAllPages('start', { onPage, fetchImpl, sleep: noSleep });

		expect(result).toEqual({});
		expect(onPage).toHaveBeenCalledTimes(1);
		const [cards, total] = onPage.mock.calls[0];
		expect(total).toBe(1);
		expect(cards[0]).toMatchObject({ id: '1', count: 1, displayFinish: '' });
	});

	it('follows next_page across multiple pages', async () => {
		const onPage = vi.fn();
		const fetchImpl = fakeFetch({
			p1: { object: 'list', total_cards: 2, has_more: true, next_page: 'p2', data: [scryfallCard] },
			p2: {
				object: 'list',
				total_cards: 2,
				has_more: false,
				data: [{ ...scryfallCard, id: '2' }]
			}
		});

		const result = await searchAllPages('p1', { onPage, fetchImpl, sleep: noSleep });

		expect(result).toEqual({});
		expect(fetchImpl).toHaveBeenCalledTimes(2);
		expect(onPage).toHaveBeenCalledTimes(2);
		expect(noSleep).toHaveBeenCalled();
	});

	it('returns an error string for an error response without reporting cards', async () => {
		const onPage = vi.fn();
		const fetchImpl = fakeFetch({
			start: { object: 'error', details: 'Invalid query.' }
		});

		const result = await searchAllPages('start', { onPage, fetchImpl, sleep: noSleep });

		expect(result.error).toBe('Invalid query.');
		expect(onPage).not.toHaveBeenCalled();
	});

	it('surfaces warnings as an error string', async () => {
		const onPage = vi.fn();
		const fetchImpl = fakeFetch({
			start: { object: 'list', total_cards: 0, has_more: false, data: [], warnings: ['w1', 'w2'] }
		});

		const result = await searchAllPages('start', { onPage, fetchImpl, sleep: noSleep });

		expect(result.error).toContain('w1 w2');
		expect(onPage).not.toHaveBeenCalled();
	});
});
