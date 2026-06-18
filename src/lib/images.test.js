import { test, expect } from 'vitest';
import { getFaces, isDoubleFaced, inlineImage } from './images.js';

test('getFaces wraps a single image object in an array', () => {
	expect(getFaces(/** @type {any} */ ({ image_uris: { border_crop: 'a' } }))).toEqual([
		{ border_crop: 'a' }
	]);
});

test('getFaces returns the array as-is for double-faced cards', () => {
	const faces = [{ border_crop: 'f' }, { border_crop: 'b' }];
	expect(getFaces(/** @type {any} */ ({ image_uris: faces }))).toEqual(faces);
});

test('isDoubleFaced only when a real second face exists', () => {
	expect(isDoubleFaced(/** @type {any} */ ({ image_uris: { border_crop: 'a' } }))).toBe(false);
	expect(
		isDoubleFaced(/** @type {any} */ ({ image_uris: [{ border_crop: 'f' }, undefined] }))
	).toBe(false);
	expect(
		isDoubleFaced(/** @type {any} */ ({ image_uris: [{ border_crop: 'f' }, { border_crop: 'b' }] }))
	).toBe(true);
});

test('inlineImage prefers border_crop, then normal', () => {
	expect(inlineImage({ border_crop: 'bc', normal: 'n' })).toBe('bc');
	expect(inlineImage({ normal: 'n' })).toBe('n');
	expect(inlineImage(undefined)).toBe('');
});
