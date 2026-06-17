import { test, expect } from 'vitest';
import { applyBulk } from './bulk.js';

/** @type {any[]} */
const cards = [
	{
		id: 'a',
		finishes: ['nonfoil', 'foil'],
		selectedFinish: '',
		displayFinish: '',
		count: 1,
		condition: 'NM'
	},
	{
		id: 'b',
		finishes: ['nonfoil'],
		selectedFinish: '',
		displayFinish: '',
		count: 1,
		condition: 'NM'
	}
];

test('applyBulk only touches selected cards', () => {
	const { cards: next } = applyBulk(cards, new Set(['a']), { count: 4 });
	expect(next[0].count).toBe(4);
	expect(next[1].count).toBe(1);
});

test('applyBulk skips cards that do not support the requested finish', () => {
	const { cards: next, skipped } = applyBulk(cards, new Set(['a', 'b']), {
		selectedFinish: 'foil'
	});
	expect(next[0].selectedFinish).toBe('foil');
	expect(next[0].displayFinish).toBe('*F*');
	expect(next[1].selectedFinish).toBe(''); // unchanged: no foil printing
	expect(skipped).toBe(1);
});

test('applyBulk sets non-finish fields without constraint', () => {
	const { cards: next, skipped } = applyBulk(cards, new Set(['a', 'b']), { condition: 'LP' });
	expect(next.every((c) => c.condition === 'LP')).toBe(true);
	expect(skipped).toBe(0);
});
