import { test, expect } from 'vitest';
import { toggle, selectRange, toggleRange, selectAll, clear } from './selection.js';

test('toggle adds then removes an id', () => {
	expect([...toggle(new Set(), 'a')]).toEqual(['a']);
	expect([...toggle(new Set(['a']), 'a')]).toEqual([]);
});

test('selectRange selects the inclusive range regardless of direction', () => {
	const ids = ['a', 'b', 'c', 'd'];
	expect(new Set(selectRange(new Set(), ids, 'b', 'd'))).toEqual(new Set(['b', 'c', 'd']));
	expect(new Set(selectRange(new Set(), ids, 'd', 'b'))).toEqual(new Set(['b', 'c', 'd']));
});

test('toggleRange adds the range, then a repeat removes it', () => {
	const ids = ['a', 'b', 'c', 'd'];
	const added = toggleRange(new Set(['a']), ids, 'a', 'c');
	expect(added).toEqual(new Set(['a', 'b', 'c']));
	// Repeating the same anchor→target deselects that range.
	expect(toggleRange(added, ids, 'a', 'c')).toEqual(new Set());
});

test('selectAll and clear', () => {
	expect(new Set(selectAll(['a', 'b']))).toEqual(new Set(['a', 'b']));
	expect([...clear()]).toEqual([]);
});
