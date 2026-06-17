import { test, expect } from 'vitest';
import { toggle, selectRange, selectAll, clear } from './selection.js';

test('toggle adds then removes an id', () => {
	expect([...toggle(new Set(), 'a')]).toEqual(['a']);
	expect([...toggle(new Set(['a']), 'a')]).toEqual([]);
});

test('selectRange selects the inclusive range regardless of direction', () => {
	const ids = ['a', 'b', 'c', 'd'];
	expect(new Set(selectRange(new Set(), ids, 'b', 'd'))).toEqual(new Set(['b', 'c', 'd']));
	expect(new Set(selectRange(new Set(), ids, 'd', 'b'))).toEqual(new Set(['b', 'c', 'd']));
});

test('selectAll and clear', () => {
	expect(new Set(selectAll(['a', 'b']))).toEqual(new Set(['a', 'b']));
	expect([...clear()]).toEqual([]);
});
