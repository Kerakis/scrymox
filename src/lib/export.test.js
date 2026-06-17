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
	displayedPrice: '1.00',
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
	it('emits the Moxfield header row', () => {
		const [header] = buildCsv([makeCard()]).split('\n');
		expect(header).toBe(
			'Count,Name,Edition,Collector Number,Condition,Language,Foil,Alter,Proxy,Price'
		);
	});

	it('uppercases the edition and maps finish/alter/proxy', () => {
		const [, row] = buildCsv([
			makeCard({ selectedFinish: 'foil', alter: true, proxy: false })
		]).split('\n');
		expect(row).toBe('1,"Lightning Bolt",LEA,161,NM,EN,foil,Yes,,1.00');
	});

	it('escapes embedded quotes in card names per CSV rules', () => {
		const [, row] = buildCsv([makeCard({ name: 'Ach! Hans, "Run!"' })]).split('\n');
		expect(row).toContain('"Ach! Hans, ""Run!"""');
	});

	it('uses the manual price when set, otherwise the auto price', () => {
		const [, manual] = buildCsv([makeCard({ price: 9.5, priceManuallySet: true })]).split('\n');
		expect(manual.endsWith(',9.5')).toBe(true);

		const [, auto] = buildCsv([makeCard({ displayedPrice: '2.34' })]).split('\n');
		expect(auto.endsWith(',2.34')).toBe(true);
	});

	it('leaves the price empty when neither manual nor auto price exists', () => {
		const [, row] = buildCsv([makeCard({ displayedPrice: null, priceManuallySet: false })]).split(
			'\n'
		);
		expect(row.endsWith(',')).toBe(true);
	});
});
