import { describe, it, expect } from 'vitest';
import { getDefaultFinish, getDisplayFinish, getFinishPrice, isFinishAllowed } from './finishes.js';

describe('getDefaultFinish', () => {
	it('prefers nonfoil and returns empty string', () => {
		expect(getDefaultFinish(['nonfoil', 'foil'])).toBe('');
	});

	it('returns foil when nonfoil is unavailable', () => {
		expect(getDefaultFinish(['foil', 'etched'])).toBe('foil');
	});

	it('returns etched when only etched is available', () => {
		expect(getDefaultFinish(['etched'])).toBe('etched');
	});

	it('returns null when no known finish is present', () => {
		expect(getDefaultFinish([])).toBe(null);
	});
});

describe('getDisplayFinish', () => {
	it('maps foil to the Moxfield foil marker', () => {
		expect(getDisplayFinish('foil')).toBe('*F*');
	});

	it('maps etched to the Moxfield etched marker', () => {
		expect(getDisplayFinish('etched')).toBe('*E*');
	});

	it('maps nonfoil/empty/null to an empty marker', () => {
		expect(getDisplayFinish('')).toBe('');
		expect(getDisplayFinish('nonfoil')).toBe('');
		expect(getDisplayFinish(null)).toBe('');
	});
});

describe('getFinishPrice', () => {
	const prices = { usd: '1.00', usd_foil: '2.00', usd_etched: '3.00' };

	it('returns the nonfoil price for empty/nonfoil finish', () => {
		expect(getFinishPrice(prices, '')).toBe('1.00');
		expect(getFinishPrice(prices, 'nonfoil')).toBe('1.00');
	});

	it('returns the foil price for foil finish', () => {
		expect(getFinishPrice(prices, 'foil')).toBe('2.00');
	});

	it('returns the etched price for etched finish', () => {
		expect(getFinishPrice(prices, 'etched')).toBe('3.00');
	});

	it('returns null when the requested price is missing', () => {
		expect(getFinishPrice({ usd: null }, 'foil')).toBe(null);
		expect(getFinishPrice(undefined, 'foil')).toBe(null);
	});
});

describe('isFinishAllowed', () => {
	it('checks the card finishes array', () => {
		expect(isFinishAllowed(['nonfoil', 'foil'], '')).toBe(true);
		expect(isFinishAllowed(['nonfoil', 'foil'], 'foil')).toBe(true);
		expect(isFinishAllowed(['nonfoil', 'foil'], 'etched')).toBe(false);
		expect(isFinishAllowed(['foil'], '')).toBe(false);
		expect(isFinishAllowed(['etched'], 'etched')).toBe(true);
		expect(isFinishAllowed([], 'foil')).toBe(false);
	});
});
