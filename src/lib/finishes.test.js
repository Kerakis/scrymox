import { describe, it, expect } from 'vitest';
import { getDefaultFinish, getDisplayFinish, isFinishAllowed } from './finishes.js';

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
