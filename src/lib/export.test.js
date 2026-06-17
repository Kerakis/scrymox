import { describe, it, expect } from 'vitest';
import { buildBulkText, buildCsv } from './export.js';

/** @returns {import('../types').Card} */
const makeCard = (overrides = {}) => ({
	id: '1',
	name: 'Lightning Bolt',
	set: 'lea',
	collector_number: '161',
	finishes: ['nonfoil'],
	selectedFinish: '',
	displayFinish: '',
	count: 1,
	condition: 'NM',
	language: 'EN',
	alter: false,
	proxy: false,
	prices: { usd: '1.00' },
	priceManuallySet: false,
	...overrides
});

describe('buildBulkText', () => {
	it('formats a nonfoil card with no trailing whitespace', () => {
		expect(buildBulkText([makeCard()])).toBe('1 Lightning Bolt (lea) 161');
	});

	it('includes the finish marker for foil cards', () => {
		expect(buildBulkText([makeCard({ count: 3, displayFinish: '*F*' })])).toBe(
			'3 Lightning Bolt (lea) 161 *F*'
		);
	});

	it('joins multiple cards with newlines', () => {
		const text = buildBulkText([makeCard(), makeCard({ name: 'Counterspell', set: 'lea' })]);
		expect(text).toBe('1 Lightning Bolt (lea) 161\n1 Counterspell (lea) 161');
	});
});

describe('buildCsv', () => {
	it('emits the Moxfield header row ending with Scryfall ID', () => {
		const [header] = buildCsv([makeCard()]).split('\n');
		expect(header).toBe(
			'Count,Name,Edition,Collector Number,Condition,Language,Foil,Alter,Proxy,Purchase Price,Scryfall ID'
		);
	});

	it('uppercases the edition, maps finish, writes TRUE/FALSE alter/proxy, and appends the id', () => {
		const [, row] = buildCsv([
			makeCard({
				id: 'sid-1',
				selectedFinish: 'foil',
				alter: true,
				proxy: false,
				prices: { usd: '1.00', usd_foil: '2.00' }
			})
		]).split('\n');
		expect(row).toBe('1,"Lightning Bolt",LEA,161,NM,EN,foil,TRUE,FALSE,2.00,sid-1');
	});

	it('escapes embedded quotes in card names per CSV rules', () => {
		const [, row] = buildCsv([makeCard({ name: 'Ach! Hans, "Run!"' })]).split('\n');
		expect(row).toContain('"Ach! Hans, ""Run!"""');
	});

	it('uses the manual price override when set', () => {
		const [, row] = buildCsv([makeCard({ id: 'x', price: 9.5, priceManuallySet: true })]).split(
			'\n'
		);
		expect(row.endsWith(',9.5,x')).toBe(true);
	});

	it('resolves the price from the selected source and finish', () => {
		const usd = buildCsv([makeCard({ prices: { usd: '3.41' } })], 'tcgplayer').split('\n')[1];
		expect(usd).toContain(',3.41,');
		const eur = buildCsv([makeCard({ prices: { eur: '2.10' } })], 'cardmarket').split('\n')[1];
		expect(eur).toContain(',2.10,');
	});

	it('leaves the price blank when the source/finish price is unavailable', () => {
		const [, row] = buildCsv([
			makeCard({ id: 'x', selectedFinish: 'etched', prices: { usd: '1.00' } })
		]).split('\n');
		expect(row.endsWith(',,x')).toBe(true); // no usd_etched -> blank price
	});
});
